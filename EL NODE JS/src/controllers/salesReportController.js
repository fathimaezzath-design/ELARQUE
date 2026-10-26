const Order = require("../models/Order");
const Product = require("../models/Product");
const Category = require("../models/Category");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the start/end dates from preset or custom range. */
function resolveDateRange(period, startDate, endDate) {
  const now = new Date();
  let start, end;

  switch (period) {
    case "today": {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    }
    case "this_week": {
      const day = now.getDay(); // 0=Sun
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    }
    case "this_month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    }
    case "this_year": {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    }
    case "custom": {
      if (!startDate || !endDate) {
        throw new Error("Custom range requires startDate and endDate.");
      }
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      break;
    }
    default: {
      // Default to this month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
  }

  return { start, end };
}

/** Percentage change helper */
function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ── GET /api/admin/sales-report ──────────────────────────────────────────────
const getSalesReport = async (req, res) => {
  try {
    const {
      period = "this_month",
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const { start, end } = resolveDateRange(period, startDate, endDate);

    // Calculate "previous" period of equal length for comparison
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start);

    // ── 1) Aggregate KPI stats for current period ──
    const [currentStats] = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lt: end },
          orderStatus: { $nin: ["Cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalDiscount: { $sum: "$discount" },
          totalCouponDiscount: { $sum: "$coupon.discountAmount" },
          totalSubtotal: { $sum: "$subtotal" },
          totalShipping: { $sum: "$shippingCharge" },
          totalPackaging: { $sum: "$packagingFee" },
          totalProductsSold: { $sum: { $size: "$items" } },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    // ── 2) Previous period stats for comparison ──
    const [prevStats] = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: prevStart, $lt: prevEnd },
          orderStatus: { $nin: ["Cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalProductsSold: { $sum: { $size: "$items" } },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    // ── 3) Monthly trajectory data (for chart) ──
    const trajectoryData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: new Date(start.getFullYear(), 0, 1), $lt: end },
          orderStatus: { $nin: ["Cancelled"] },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$orderDate" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];

    const salesTrajectory = months.map((label, idx) => {
      const found = trajectoryData.find((d) => d._id.month === idx + 1);
      return {
        month: label,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
      };
    });

    // ── 4) Category-wise revenue breakdown ──
    const categoryRevenue = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lt: end },
          orderStatus: { $nin: ["Cancelled"] },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "product",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.categoryId",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$categoryInfo.name",
          revenue: { $sum: "$items.itemTotal" },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
    ]);

    // ── 5) Top products in period (for best sellers) ──
    const topProducts = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lt: end },
          orderStatus: { $nin: ["Cancelled"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          productImage: { $first: "$items.productImage" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.itemTotal" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 1 },
    ]);

    // ── 6) Coupon usage breakdown ──
    const couponBreakdown = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lt: end },
          orderStatus: { $nin: ["Cancelled"] },
          "coupon.code": { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$coupon.code",
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: "$coupon.discountAmount" },
          discountType: { $first: "$coupon.discountType" },
        },
      },
      { $sort: { totalDiscount: -1 } },
      { $limit: 10 },
    ]);

    // ── 7) Detailed orders list (paginated) ──
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const detailedOrders = await Order.find({
      orderDate: { $gte: start, $lt: end },
      orderStatus: { $nin: ["Cancelled"] },
    })
      .populate("user", "name email")
      .populate("items.product", "name categoryId")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalDetailedOrders = await Order.countDocuments({
      orderDate: { $gte: start, $lt: end },
      orderStatus: { $nin: ["Cancelled"] },
    });

    // ── 8) Payment method breakdown ──
    const paymentBreakdown = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lt: end },
          orderStatus: { $nin: ["Cancelled"] },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // ── 9) Order status distribution ──
    const statusDistribution = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // ── 10) Returning vs new customers ──
    const customerMetrics = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lt: end },
          orderStatus: { $nin: ["Cancelled"] },
        },
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          returningCustomers: {
            $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] },
          },
        },
      },
    ]);

    // ── Build response ──
    const cur = currentStats || {
      totalRevenue: 0,
      totalOrders: 0,
      totalDiscount: 0,
      totalCouponDiscount: 0,
      totalSubtotal: 0,
      totalShipping: 0,
      totalPackaging: 0,
      totalProductsSold: 0,
      avgOrderValue: 0,
    };

    const prev = prevStats || {
      totalRevenue: 0,
      totalOrders: 0,
      totalProductsSold: 0,
      avgOrderValue: 0,
    };

    const custMetrics = customerMetrics[0] || {
      totalCustomers: 0,
      returningCustomers: 0,
    };

    const retentionRate =
      custMetrics.totalCustomers > 0
        ? Math.round(
            (custMetrics.returningCustomers / custMetrics.totalCustomers) * 100
          )
        : 0;

    res.json({
      success: true,
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      kpi: {
        totalRevenue: cur.totalRevenue,
        revenueChange: pctChange(cur.totalRevenue, prev.totalRevenue),
        totalProductsSold: cur.totalProductsSold,
        productsSoldChange: pctChange(
          cur.totalProductsSold,
          prev.totalProductsSold
        ),
        totalOrders: cur.totalOrders,
        ordersChange: pctChange(cur.totalOrders, prev.totalOrders),
        avgOrderValue: Math.round(cur.avgOrderValue || 0),
        avgOrderChange: pctChange(
          Math.round(cur.avgOrderValue || 0),
          Math.round(prev.avgOrderValue || 0)
        ),
        totalDiscount: cur.totalDiscount,
        totalCouponDiscount: cur.totalCouponDiscount,
        totalSubtotal: cur.totalSubtotal,
      },
      salesTrajectory,
      categoryRevenue,
      topProduct: topProducts[0] || null,
      couponBreakdown,
      paymentBreakdown,
      statusDistribution,
      customerMetrics: {
        totalCustomers: custMetrics.totalCustomers,
        returningCustomers: custMetrics.returningCustomers,
        retentionRate,
      },
      detailedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalDetailedOrders,
        totalPages: Math.ceil(totalDetailedOrders / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("SALES REPORT ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate sales report.",
    });
  }
};

// ── GET /api/admin/sales-report/download ─────────────────────────────────────
// Returns raw order data for client-side PDF/Excel generation
const downloadSalesReport = async (req, res) => {
  try {
    const { period = "this_month", startDate, endDate } = req.query;

    const { start, end } = resolveDateRange(period, startDate, endDate);

    const orders = await Order.find({
      orderDate: { $gte: start, $lt: end },
      orderStatus: { $nin: ["Cancelled"] },
    })
      .populate("user", "name email")
      .sort({ orderDate: -1 })
      .lean();

    // Flatten to row-level for spreadsheet
    const rows = orders.map((order) => ({
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      customerName: order.user?.name || "N/A",
      customerEmail: order.user?.email || "N/A",
      itemCount: order.items?.length || 0,
      subtotal: order.subtotal,
      discount: order.discount,
      couponCode: order.coupon?.code || "—",
      couponDiscount: order.coupon?.discountAmount || 0,
      shippingCharge: order.shippingCharge,
      packagingFee: order.packagingFee,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    }));

    // Summary row
    const summary = {
      totalOrders: rows.length,
      totalRevenue: rows.reduce((s, r) => s + r.totalAmount, 0),
      totalDiscount: rows.reduce((s, r) => s + r.discount, 0),
      totalCouponDiscount: rows.reduce((s, r) => s + r.couponDiscount, 0),
      totalSubtotal: rows.reduce((s, r) => s + r.subtotal, 0),
    };

    res.json({
      success: true,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      summary,
      rows,
    });
  } catch (err) {
    console.error("SALES REPORT DOWNLOAD ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to prepare report download.",
    });
  }
};

module.exports = {
  getSalesReport,
  downloadSalesReport,
};
