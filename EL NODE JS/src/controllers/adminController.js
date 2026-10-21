const Admin = require("../models/Admin");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred during admin login.",
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // === PRODUCT STATS (MongoDB aggregation) ===
    const productStatsPipeline = [
      { $match: { isDeleted: false } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                activeProducts: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                inactiveProducts: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
                featuredProducts: { $sum: { $cond: ["$isFeatured", 1, 0] } },
                bestSellers: { $sum: { $cond: ["$isBestSeller", 1, 0] } },
                onSaleProducts: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$salePrice", null] },
                          { $gt: ["$price", 0] },
                          { $lt: ["$salePrice", "$price"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          newThisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $count: "count" },
          ],
          newLastMonth: [
            { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $count: "count" },
          ],
        },
      },
    ];

    // === VARIANT / STOCK STATS & INVENTORY VALUATION ===
    const variantStatsPipeline = [
      { $match: { isDeleted: false } },
      { $unwind: "$variants" },
      {
        $group: {
          _id: null,
          totalVariants: { $sum: 1 },
          totalStock: { $sum: { $ifNull: ["$variants.stock", 0] } },
          totalInventoryValue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$variants.stock", 0] },
                {
                  $ifNull: [
                    "$variants.price",
                    { $ifNull: ["$variants.salePrice", { $ifNull: ["$price", 0] }] },
                  ],
                },
              ],
            },
          },
          outOfStock: { $sum: { $cond: [{ $eq: ["$variants.stock", 0] }, 1, 0] } },
          lowStock: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$variants.stock", 0] }, { $lte: ["$variants.stock", 5] }] },
                1,
                0,
              ],
            },
          },
          inStock: { $sum: { $cond: [{ $gt: ["$variants.stock", 5] }, 1, 0] } },
        },
      },
    ];

    // === TOP 6 PRODUCTS BY RECENT ADDITION ===
    const topProductsPipeline = [
      { $match: { isDeleted: false, status: "active" } },
      {
        $addFields: {
          totalStock: { $sum: "$variants.stock" },
          variantCount: { $size: "$variants" },
          firstImage: {
            $let: {
              vars: {
                firstVariantWithImg: {
                  $first: {
                    $filter: {
                      input: "$variants",
                      as: "v",
                      cond: { $gt: [{ $size: { $ifNull: ["$$v.images", []] } }, 0] },
                    },
                  },
                },
              },
              in: { $first: { $ifNull: ["$$firstVariantWithImg.images", []] } },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "category",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDoc",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          brand: 1,
          price: 1,
          salePrice: 1,
          status: 1,
          isFeatured: 1,
          isBestSeller: 1,
          createdAt: 1,
          totalStock: 1,
          variantCount: 1,
          firstImage: 1,
          categoryName: { $ifNull: [{ $first: "$categoryDoc.name" }, "Uncategorized"] },
        },
      },
    ];

    // === USER STATS ===
    const userStatsPipeline = [
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                verifiedUsers: { $sum: { $cond: ["$isVerified", 1, 0] } },
                blockedUsers: { $sum: { $cond: ["$isBlocked", 1, 0] } },
                googleUsers: {
                  $sum: { $cond: [{ $ne: ["$googleId", ""] }, 1, 0] },
                },
              },
            },
          ],
          newThisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $count: "count" },
          ],
          newLast7Days: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $count: "count" },
          ],
          newLastMonth: [
            { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $count: "count" },
          ],
        },
      },
    ];

    // === CATEGORY STATS ===
    const categoryStatsPipeline = [
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
                deleted: { $sum: { $cond: ["$isDeleted", 1, 0] } },
              },
            },
          ],
        },
      },
    ];

    // === ORDER / REVENUE STATS ===
    const orderStatsPipeline = [
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Cancelled", "Returned"]] },
                      0,
                      { $ifNull: ["$totalAmount", 0] },
                    ],
                  },
                },
                placedOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Placed", "placed", "Pending", "pending"]] },
                      1,
                      0,
                    ],
                  },
                },
                processingOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Processing", "processing", "Confirmed", "confirmed", "Shipped", "shipped"]] },
                      1,
                      0,
                    ],
                  },
                },
                deliveredOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Delivered", "delivered"]] },
                      1,
                      0,
                    ],
                  },
                },
                cancelledOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Cancelled", "cancelled"]] },
                      1,
                      0,
                    ],
                  },
                },
                returnedOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Returned", "returned"]] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          newThisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Cancelled", "Returned"]] },
                      0,
                      { $ifNull: ["$totalAmount", 0] },
                    ],
                  },
                },
              },
            },
          ],
          newLastMonth: [
            { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ["$orderStatus", ["Cancelled", "Returned"]] },
                      0,
                      { $ifNull: ["$totalAmount", 0] },
                    ],
                  },
                },
              },
            },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 6 },
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDoc",
              },
            },
            {
              $project: {
                _id: 1,
                orderNumber: 1,
                totalAmount: 1,
                orderStatus: 1,
                paymentStatus: 1,
                paymentMethod: 1,
                createdAt: 1,
                itemCount: { $size: { $ifNull: ["$items", []] } },
                customerName: {
                  $ifNull: [{ $first: "$userDoc.fullName" }, "$shippingAddress.fullName"],
                },
                customerEmail: { $first: "$userDoc.email" },
              },
            },
          ],
        },
      },
    ];

    // Run all queries in parallel
    const [
      productStatsResult,
      variantStatsResult,
      topProductsResult,
      userStatsResult,
      categoryStatsResult,
      orderStatsResult,
    ] = await Promise.all([
      Product.aggregate(productStatsPipeline),
      Product.aggregate(variantStatsPipeline),
      Product.aggregate(topProductsPipeline),
      User.aggregate(userStatsPipeline),
      Category.aggregate(categoryStatsPipeline),
      Order.aggregate(orderStatsPipeline),
    ]);

    // Extract results
    const productOverall = productStatsResult[0]?.overall[0] || {};
    const variantOverall = variantStatsResult[0] || {};
    const userOverall = userStatsResult[0]?.overall[0] || {};
    const catOverall = categoryStatsResult[0]?.overall[0] || {};
    const orderOverall = orderStatsResult[0]?.overall[0] || {};

    const newProductsThisMonth = productStatsResult[0]?.newThisMonth[0]?.count || 0;
    const newProductsLastMonth = productStatsResult[0]?.newLastMonth[0]?.count || 0;
    const newUsersThisMonth = userStatsResult[0]?.newThisMonth[0]?.count || 0;
    const newUsersLast7Days = userStatsResult[0]?.newLast7Days[0]?.count || 0;
    const newUsersLastMonth = userStatsResult[0]?.newLastMonth[0]?.count || 0;

    const newOrdersThisMonth = orderStatsResult[0]?.newThisMonth[0]?.count || 0;
    const newOrdersLastMonth = orderStatsResult[0]?.newLastMonth[0]?.count || 0;
    const revenueThisMonth = orderStatsResult[0]?.newThisMonth[0]?.revenue || 0;
    const revenueLastMonth = orderStatsResult[0]?.newLastMonth[0]?.revenue || 0;

    // Format recent products
    const recentProducts = topProductsResult.map((p) => ({
      id: p._id.toString(),
      name: p.name || "",
      brand: p.brand || "",
      category: p.categoryName || "Uncategorized",
      price: p.price || 0,
      salePrice: p.salePrice ?? null,
      status: p.status,
      isFeatured: p.isFeatured || false,
      isBestSeller: p.isBestSeller || false,
      totalStock: p.totalStock || 0,
      variantCount: p.variantCount || 0,
      image: p.firstImage || null,
      createdAt: p.createdAt,
    }));

    // Format recent orders
    const recentOrders = (orderStatsResult[0]?.recentOrders || []).map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber || "EL-ORDER",
      totalAmount: o.totalAmount || 0,
      orderStatus: o.orderStatus || "Placed",
      paymentStatus: o.paymentStatus || "Pending",
      paymentMethod: o.paymentMethod || "COD",
      itemCount: o.itemCount || 0,
      customerName: o.customerName || "Valued Client",
      customerEmail: o.customerEmail || "",
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        revenue: {
          total: orderOverall.totalRevenue || 0,
          thisMonth: revenueThisMonth,
          lastMonth: revenueLastMonth,
        },
        orders: {
          total: orderOverall.totalOrders || 0,
          placed: orderOverall.placedOrders || 0,
          processing: orderOverall.processingOrders || 0,
          delivered: orderOverall.deliveredOrders || 0,
          cancelled: orderOverall.cancelledOrders || 0,
          returned: orderOverall.returnedOrders || 0,
          newThisMonth: newOrdersThisMonth,
          newLastMonth: newOrdersLastMonth,
        },
        products: {
          total: productOverall.totalProducts || 0,
          active: productOverall.activeProducts || 0,
          inactive: productOverall.inactiveProducts || 0,
          featured: productOverall.featuredProducts || 0,
          bestSellers: productOverall.bestSellers || 0,
          onSale: productOverall.onSaleProducts || 0,
          newThisMonth: newProductsThisMonth,
          newLastMonth: newProductsLastMonth,
        },
        variants: {
          total: variantOverall.totalVariants || 0,
          totalStock: variantOverall.totalStock || 0,
          totalInventoryValue: variantOverall.totalInventoryValue || 0,
          outOfStock: variantOverall.outOfStock || 0,
          lowStock: variantOverall.lowStock || 0,
          inStock: variantOverall.inStock || 0,
        },
        users: {
          total: userOverall.totalUsers || 0,
          verified: userOverall.verifiedUsers || 0,
          blocked: userOverall.blockedUsers || 0,
          googleUsers: userOverall.googleUsers || 0,
          newThisMonth: newUsersThisMonth,
          newLast7Days: newUsersLast7Days,
          newLastMonth: newUsersLastMonth,
        },
        categories: {
          total: catOverall.total || 0,
          active: catOverall.active || 0,
          inactive: catOverall.inactive || 0,
        },
      },
      recentProducts,
      recentOrders,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while fetching dashboard statistics.",
    });
  }
};
