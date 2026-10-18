const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// Helper to escape regex special characters for safe MongoDB searches
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// Helper to safely restore stock for items
async function restoreStockForItems(items) {
  const restoreResults = [];

  for (const item of items) {
    if (item.stockRestored) continue;

    const productId = item.product?._id || item.product;
    const variantId = item.variantId || item.variant?._id;
    const quantity = Number(item.quantity) || 1;

    if (!productId || !variantId) continue;

    try {
      const updated = await Product.findOneAndUpdate(
        {
          _id: productId,
          "variants._id": variantId,
        },
        {
          $inc: { "variants.$.stock": quantity },
        },
        { returnDocument: "after" }
      );

      if (updated) {
        item.stockRestored = true;
        restoreResults.push({ productId, variantId, quantity, status: "restored" });
      }
    } catch (err) {
      console.error(`Failed to restore stock for product ${productId}, variant ${variantId}:`, err);
    }
  }

  return restoreResults;
}

// =========================================================================
// GET ALL ORDERS (Admin)
// GET /api/admin/orders
// Query params: page, limit, status, search, paymentStatus, paymentMethod, sort
// =========================================================================
exports.getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      paymentStatus,
      paymentMethod,
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    // Filter by orderStatus
    if (status && status !== "All" && status !== "all") {
      filter.orderStatus = status;
    }

    // Filter by paymentStatus
    if (paymentStatus && paymentStatus !== "All") {
      filter.paymentStatus = paymentStatus;
    }

    // Filter by paymentMethod
    if (paymentMethod && paymentMethod !== "All") {
      filter.paymentMethod = paymentMethod;
    }

    // Build Search Filter
    if (search && typeof search === "string" && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, "i");

      // Find matching users first
      const matchingUsers = await User.find({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex },
        ],
      }).select("_id").lean();

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { orderNumber: searchRegex },
        { "shippingAddress.fullName": searchRegex },
        { "shippingAddress.phone": searchRegex },
        { "shippingAddress.city": searchRegex },
        { user: { $in: userIds } },
      ];
    }

    // Sorting
    let sortOption = { orderDate: -1, createdAt: -1 };
    if (sort === "oldest") {
      sortOption = { orderDate: 1, createdAt: 1 };
    } else if (sort === "amount_high") {
      sortOption = { totalAmount: -1 };
    } else if (sort === "amount_low") {
      sortOption = { totalAmount: 1 };
    }

    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        .populate("user", "fullName email phoneNumber profileImage")
        .lean(),
    ]);

    const totalPages = Math.ceil(totalOrders / limitNumber) || 1;

    return res.status(200).json({
      success: true,
      orders,
      totalOrders,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("ADMIN GET ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving orders.",
    });
  }
};

// =========================================================================
// GET ORDER BY ID (Admin)
// GET /api/admin/orders/:id
// =========================================================================
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order identifier format.",
      });
    }

    const order = await Order.findById(id)
      .populate("user", "fullName email phoneNumber profileImage wallet")
      .populate("items.product", "name brand price images")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("ADMIN GET ORDER BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving order details.",
    });
  }
};

// =========================================================================
// UPDATE ORDER STATUS (Admin)
// PATCH /api/admin/orders/:id/status
// Body: { orderStatus, note? }
// =========================================================================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, note = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order identifier format.",
      });
    }

    const allowedStatuses = [
      "Placed",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned",
    ];

    if (!orderStatus || !allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Prevent changing already Delivered or Cancelled orders without special action
    if (order.orderStatus === "Cancelled" && orderStatus !== "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be reopened.",
      });
    }

    if (order.orderStatus === "Delivered" && !["Delivered", "Returned"].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Delivered orders can only be marked as Returned.",
      });
    }

    const prevStatus = order.orderStatus;
    order.orderStatus = orderStatus;

    // Handle timestamps & side effects based on new status
    if (orderStatus === "Delivered") {
      order.deliveredDate = new Date();
      // If COD order is delivered, it is now Paid
      if (order.paymentMethod === "COD") {
        order.paymentStatus = "Paid";
      }
    } else if (orderStatus === "Cancelled") {
      order.cancelledDate = new Date();
      if (note && note.trim()) {
        order.cancellationReason = note.trim();
      }

      // Restore inventory if cancelling
      if (!order.stockRestored) {
        await restoreStockForItems(order.items);
        order.stockRestored = true;
      }

      // Mark all items as Cancelled
      order.items.forEach((item) => {
        if (item.itemStatus === "Active") {
          item.itemStatus = "Cancelled";
        }
      });

      // If customer paid online or via wallet, refund to wallet
      if (["Paid"].includes(order.paymentStatus) && ["ONLINE", "WALLET"].includes(order.paymentMethod)) {
        await User.findByIdAndUpdate(order.user, {
          $inc: { wallet: order.totalAmount },
        });
        order.paymentStatus = "Refunded";
      }
    } else if (orderStatus === "Returned") {
      order.returnStatus = "Approved";

      // Restore inventory if returning
      if (!order.stockRestored) {
        await restoreStockForItems(order.items);
        order.stockRestored = true;
      }

      // Mark items as Returned
      order.items.forEach((item) => {
        if (item.itemStatus !== "Cancelled") {
          item.itemStatus = "Returned";
          item.returnStatus = "Approved";
        }
      });

      // Refund to wallet if paid
      if (["Paid"].includes(order.paymentStatus)) {
        await User.findByIdAndUpdate(order.user, {
          $inc: { wallet: order.totalAmount },
        });
        order.paymentStatus = "Refunded";
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated from ${prevStatus} to ${orderStatus}.`,
      order,
    });
  } catch (error) {
    console.error("ADMIN UPDATE ORDER STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating order status.",
    });
  }
};

// =========================================================================
// HANDLE RETURN REQUEST (Admin)
// PATCH /api/admin/orders/:id/return
// Body: { action: "Approve" | "Reject", itemId?, reason? }
// =========================================================================
exports.handleReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, itemId, reason = "" } = req.body;

    if (!["Approve", "Reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "Approve" or "Reject".',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const isApproval = action === "Approve";

    // Item-level return
    if (itemId) {
      const item = order.items.id(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Order item not found.",
        });
      }

      item.returnStatus = isApproval ? "Approved" : "Rejected";
      if (isApproval) {
        item.itemStatus = "Returned";
        // Restore stock for this single item
        await restoreStockForItems([item]);

        // Refund item price to customer wallet
        if (order.paymentStatus === "Paid") {
          await User.findByIdAndUpdate(order.user, {
            $inc: { wallet: item.itemTotal },
          });
        }
      }

      // Check if all items are now returned
      const activeItems = order.items.filter((i) => i.itemStatus === "Active");
      if (activeItems.length === 0) {
        order.orderStatus = "Returned";
        order.returnStatus = "Approved";
      }
    } else {
      // Full order return
      order.returnStatus = isApproval ? "Approved" : "Rejected";

      if (isApproval) {
        order.orderStatus = "Returned";
        await restoreStockForItems(order.items);
        order.stockRestored = true;

        order.items.forEach((i) => {
          if (i.itemStatus !== "Cancelled") {
            i.itemStatus = "Returned";
            i.returnStatus = "Approved";
          }
        });

        // Refund full amount to wallet
        if (order.paymentStatus === "Paid") {
          await User.findByIdAndUpdate(order.user, {
            $inc: { wallet: order.totalAmount },
          });
          order.paymentStatus = "Refunded";
        }
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Return request ${action.toLowerCase()}d successfully.`,
      order,
    });
  } catch (error) {
    console.error("ADMIN HANDLE RETURN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the return request.",
    });
  }
};

// =========================================================================
// GET ORDER STATS (Admin)
// GET /api/admin/orders/stats
// =========================================================================
exports.getOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      placedCount,
      confirmedCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      returnedCount,
      returnRequestedCount,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "Placed" }),
      Order.countDocuments({ orderStatus: "Confirmed" }),
      Order.countDocuments({ orderStatus: "Processing" }),
      Order.countDocuments({ orderStatus: "Shipped" }),
      Order.countDocuments({ orderStatus: "Delivered" }),
      Order.countDocuments({ orderStatus: "Cancelled" }),
      Order.countDocuments({ orderStatus: "Returned" }),
      Order.countDocuments({
        $or: [
          { returnStatus: "Requested" },
          { "items.returnStatus": "Requested" },
        ],
      }),
      Order.aggregate([
        { $match: { orderStatus: { $nin: ["Cancelled", "Returned"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        activeOrders: placedCount + confirmedCount + processingCount + shippedCount,
        placedCount,
        confirmedCount,
        processingCount,
        shippedCount,
        deliveredCount,
        cancelledCount,
        returnedCount,
        returnRequestedCount,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("ADMIN GET ORDER STATS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while calculating order metrics.",
    });
  }
};
