const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

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
      console.error(
        `Failed to restore stock for product ${productId}, variant ${variantId}:`,
        err
      );
    }
  }

  return restoreResults;
}

// Helper to normalize return status string for uniform UI badges
function normalizeStatus(status) {
  if (!status || status === "None") return "None";
  const s = String(status).trim().toLowerCase();
  if (s === "requested" || s === "pending") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "picked up" || s === "pickedup" || s === "in transit") return "Picked Up";
  if (s === "completed" || s === "refunded") return "Refunded";
  if (s === "rejected") return "Rejected";
  return status;
}

// Helper to extract return requests from orders
function extractReturnRequests(orders) {
  const list = [];

  for (const order of orders) {
    const customer = {
      _id: order.user?._id,
      fullName: order.user?.fullName || order.shippingAddress?.fullName || "Private Client",
      email: order.user?.email || "client@elarque.com",
      phone: order.user?.phone || order.shippingAddress?.phone || "",
      wallet: order.user?.wallet || 0,
      createdAt: order.user?.createdAt,
      shippingAddress: order.shippingAddress,
    };

    // Check item-level returns
    const returnedItems = (order.items || []).filter(
      (item) => item.returnStatus && item.returnStatus !== "None"
    );

    if (returnedItems.length > 0) {
      for (const item of returnedItems) {
        const normalized = normalizeStatus(item.returnStatus);
        list.push({
          id: `${order._id}_${item._id}`,
          orderId: order._id,
          orderNumber: order.orderNumber,
          itemId: item._id,
          isItemReturn: true,
          productName: item.productName || "Atelier Creation",
          productImage: item.productImage || "",
          variant: item.variant || {},
          quantity: item.quantity || 1,
          price: item.price || 0,
          itemTotal: item.itemTotal || (item.price || 0) * (item.quantity || 1),
          returnAmount: item.itemTotal || (item.price || 0) * (item.quantity || 1),
          returnReason: item.returnReason || order.returnReason || "Size & Fit Optimization",
          returnStatus: normalized,
          rawStatus: item.returnStatus,
          itemStatus: item.itemStatus,
          returnRequestedAt:
            item.returnRequestedAt || order.returnRequestedAt || order.updatedAt || order.orderDate,
          returnAdminNote: item.returnAdminNote || order.returnAdminNote || "",
          returnRejectionReason: item.returnRejectionReason || order.returnRejectionReason || "",
          returnCustomerMessage: item.returnCustomerMessage || order.returnCustomerMessage || "",
          returnPickupScheduledDate: order.returnPickupScheduledDate,
          customer,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          orderDate: order.orderDate,
          deliveredDate: order.deliveredDate,
          orderTotalAmount: order.totalAmount,
        });
      }
    } else if (order.returnStatus && order.returnStatus !== "None") {
      // Order-level return where items weren't flagged individually
      const primaryItem = order.items?.[0] || {};
      const normalized = normalizeStatus(order.returnStatus);
      list.push({
        id: `${order._id}_full`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        itemId: primaryItem._id,
        isItemReturn: false,
        productName: primaryItem.productName || "Full Order Atelier Return",
        productImage: primaryItem.productImage || "",
        variant: primaryItem.variant || {},
        quantity: primaryItem.quantity || 1,
        price: primaryItem.price || order.totalAmount,
        itemTotal: order.totalAmount,
        returnAmount: order.totalAmount,
        returnReason: order.returnReason || "Atelier Return Request",
        returnStatus: normalized,
        rawStatus: order.returnStatus,
        itemStatus: primaryItem.itemStatus || "ReturnRequested",
        returnRequestedAt: order.returnRequestedAt || order.updatedAt || order.orderDate,
        returnAdminNote: order.returnAdminNote || "",
        returnRejectionReason: order.returnRejectionReason || "",
        returnCustomerMessage: order.returnCustomerMessage || "",
        returnPickupScheduledDate: order.returnPickupScheduledDate,
        customer,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        orderDate: order.orderDate,
        deliveredDate: order.deliveredDate,
        orderTotalAmount: order.totalAmount,
      });
    }
  }

  return list;
}


// GET ALL RETURN REQUESTS (Admin)
// GET /api/admin/returns
// Query params: page, limit, status, search, sort

exports.getReturnRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "ALL",
      search = "",
      sort = "newest",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    // Query all orders that have any return flag
    const baseFilter = {
      $or: [
        { returnStatus: { $ne: "None", $exists: true } },
        { "items.returnStatus": { $ne: "None", $exists: true } },
      ],
    };

    const orders = await Order.find(baseFilter)
      .populate("user", "fullName email phone wallet createdAt")
      .sort({ updatedAt: -1, orderDate: -1 })
      .lean();

    // Extract individual return request records
    let allReturns = extractReturnRequests(orders);

    // Compute real database-backed summary statistics across all extracted returns
    const totalReturns = allReturns.length;
    const pendingCount = allReturns.filter((r) => r.returnStatus === "Pending").length;
    const approvedCount = allReturns.filter(
      (r) => r.returnStatus === "Approved" || r.returnStatus === "Picked Up"
    ).length;
    const completedCount = allReturns.filter((r) => r.returnStatus === "Refunded").length;
    const rejectedCount = allReturns.filter((r) => r.returnStatus === "Rejected").length;

    const totalRefundedAmount = allReturns
      .filter((r) => r.returnStatus === "Refunded")
      .reduce((acc, curr) => acc + (Number(curr.returnAmount) || 0), 0);

    // Apply status filter if not ALL
    if (status && status !== "ALL") {
      const target = status.trim().toUpperCase();
      allReturns = allReturns.filter((r) => {
        if (target === "PENDING") return r.returnStatus === "Pending";
        if (target === "APPROVED")
          return r.returnStatus === "Approved" || r.returnStatus === "Picked Up";
        if (target === "REJECTED") return r.returnStatus === "Rejected";
        if (target === "COMPLETED" || target === "REFUNDED")
          return r.returnStatus === "Refunded";
        return true;
      });
    }

    // Apply search filter (orderNumber, customer name, email, phone, product name, return reason)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allReturns = allReturns.filter((r) => {
        const matchOrder = r.orderNumber?.toLowerCase().includes(q);
        const matchCust = r.customer?.fullName?.toLowerCase().includes(q);
        const matchEmail = r.customer?.email?.toLowerCase().includes(q);
        const matchPhone = r.customer?.phone?.toLowerCase().includes(q);
        const matchProd = r.productName?.toLowerCase().includes(q);
        const matchReason = r.returnReason?.toLowerCase().includes(q);
        return matchOrder || matchCust || matchEmail || matchPhone || matchProd || matchReason;
      });
    }

    // Apply sorting
    if (sort === "oldest") {
      allReturns.sort(
        (a, b) => new Date(a.returnRequestedAt) - new Date(b.returnRequestedAt)
      );
    } else if (sort === "amount_high") {
      allReturns.sort((a, b) => (b.returnAmount || 0) - (a.returnAmount || 0));
    } else if (sort === "amount_low") {
      allReturns.sort((a, b) => (a.returnAmount || 0) - (b.returnAmount || 0));
    } else {
      // default: newest first
      allReturns.sort(
        (a, b) => new Date(b.returnRequestedAt) - new Date(a.returnRequestedAt)
      );
    }

    // Pagination
    const filteredTotal = allReturns.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedReturns = allReturns.slice(startIndex, startIndex + limitNum);

    return res.status(200).json({
      success: true,
      returns: paginatedReturns,
      pagination: {
        total: filteredTotal,
        page: pageNum,
        pages: Math.ceil(filteredTotal / limitNum) || 1,
        limit: limitNum,
      },
      stats: {
        totalReturns,
        pendingCount,
        approvedCount,
        completedCount,
        rejectedCount,
        totalRefundedAmount,
      },
    });
  } catch (error) {
    console.error("GET ADMIN RETURN REQUESTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving return requests.",
    });
  }
};


// GET SINGLE RETURN REQUEST (Admin)
// GET /api/admin/returns/:id

exports.getReturnRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    let orderId = id;
    let targetItemId = null;

    if (id.includes("_")) {
      const parts = id.split("_");
      orderId = parts[0];
      targetItemId = parts[1] === "full" ? null : parts[1];
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return request identifier.",
      });
    }

    const order = await Order.findById(orderId).populate(
      "user",
      "fullName email phone wallet createdAt"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Associated order could not be located.",
      });
    }

    const allReturns = extractReturnRequests([order]);
    let returnRecord = null;

    if (targetItemId) {
      returnRecord = allReturns.find(
        (r) => String(r.itemId) === String(targetItemId)
      );
    }
    if (!returnRecord && allReturns.length > 0) {
      returnRecord = allReturns[0];
    }

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: "No return request dossier found for this order.",
      });
    }

    return res.status(200).json({
      success: true,
      returnRequest: returnRecord,
      order,
    });
  } catch (error) {
    console.error("GET RETURN REQUEST BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the return dossier.",
    });
  }
};


// UPDATE RETURN STATUS (Admin)
// PATCH /api/admin/returns/:id/status
// Body: { status, adminNote, rejectionReason, customerMessage, notifyCustomer }

exports.updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      adminNote = "",
      rejectionReason = "",
      customerMessage = "",
      notifyCustomer = true,
    } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "New status assignment is required.",
      });
    }

    let orderId = id;
    let targetItemId = null;

    if (id.includes("_")) {
      const parts = id.split("_");
      orderId = parts[0];
      targetItemId = parts[1] === "full" ? null : parts[1];
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return request identifier.",
      });
    }

    const order = await Order.findById(orderId).populate(
      "user",
      "fullName email phone wallet createdAt"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Associated order not found.",
      });
    }

    // Standardize input status
    const targetStatusNorm = normalizeStatus(status);
    let targetDbStatus = "Requested";
    if (targetStatusNorm === "Pending") targetDbStatus = "Requested";
    else if (targetStatusNorm === "Approved") targetDbStatus = "Approved";
    else if (targetStatusNorm === "Picked Up") targetDbStatus = "Picked Up";
    else if (targetStatusNorm === "Refunded") targetDbStatus = "Completed";
    else if (targetStatusNorm === "Rejected") targetDbStatus = "Rejected";

    // Rejection reason validation
    if (targetStatusNorm === "Rejected" && !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A mandatory rejection reason is required when rejecting a return request.",
      });
    }

    // Determine current return status
    let currentItem = null;
    let currentRawStatus = order.returnStatus;

    if (targetItemId) {
      currentItem = order.items.id(targetItemId);
      if (currentItem) {
        currentRawStatus = currentItem.returnStatus;
      }
    }
    const currentStatusNorm = normalizeStatus(currentRawStatus);

    // Validate Status Transitions
    const VALID_TRANSITIONS = {
      Pending: ["Approved", "Rejected"],
      Approved: ["Picked Up", "Refunded", "Rejected"],
      "Picked Up": ["Refunded", "Rejected"],
      Rejected: ["Approved"], // Admin override
      Refunded: [], // Terminal
    };

    const allowed = VALID_TRANSITIONS[currentStatusNorm] || [];
    if (currentStatusNorm !== targetStatusNorm && !allowed.includes(targetStatusNorm)) {
      return res.status(400).json({
        success: false,
        message: `Invalid return status transition from "${currentStatusNorm}" to "${targetStatusNorm}". Allowed next states: ${
          allowed.length ? allowed.join(", ") : "None (Terminal State)"
        }.`,
      });
    }

    // Apply changes
    const now = new Date();

    if (currentItem) {
      currentItem.returnStatus = targetDbStatus;
      if (adminNote) currentItem.returnAdminNote = adminNote.trim();
      if (rejectionReason) currentItem.returnRejectionReason = rejectionReason.trim();
      if (customerMessage) currentItem.returnCustomerMessage = customerMessage.trim();

      if (targetStatusNorm === "Approved" || targetStatusNorm === "Refunded") {
        currentItem.itemStatus = "Returned";
        // Restore inventory if not already done
        await restoreStockForItems([currentItem]);

        // Process wallet refund — idempotency guard prevents double-credit
        if (!currentItem.walletRefunded) {
          const refundAmount = Number(currentItem.itemTotal) || 0;

          if (refundAmount > 0) {
            // Mark refunded BEFORE crediting to prevent race-condition double-credit
            currentItem.walletRefunded = true;

            await User.findByIdAndUpdate(order.user?._id || order.user, {
              $inc: { wallet: refundAmount },
            });
            try {
              const uniqueSuffix = Date.now().toString().slice(-4);
              await WalletTransaction.create({
                user: order.user?._id || order.user,
                transactionId: `TXN-${currentItem._id.toString().slice(-6).toUpperCase()}-${uniqueSuffix}-REF`,
                type: "CREDIT",
                amount: refundAmount,
                title: `Refund from Order #${order.orderNumber}`,
                description: `${currentItem.productName || "Atelier Item"} Return Approved — ELARQUE Wallet Credit`,
                status: "COMPLETED",
                paymentRail: "ELARQUE Wallet Refund",
                order: order._id,
                orderNumber: order.orderNumber,
                referenceProtocol: "ELG-VLT-RESERVE-2026",
                date: new Date(),
              });
            } catch (txErr) {
              console.error("WARNING: Failed to log return refund tx:", txErr.message);
            }
          }
        }
      } else if (targetStatusNorm === "Rejected") {
        currentItem.itemStatus = "Active";
      }

      // Check if all items in order have reached a returned/refunded state
      const nonReturned = order.items.filter(
        (i) => i.itemStatus !== "Returned" && i.itemStatus !== "Cancelled"
      );
      if (nonReturned.length === 0) {
        order.orderStatus = "Returned";
        order.returnStatus = targetDbStatus;
      }
    } else {
      // Full order return
      order.returnStatus = targetDbStatus;
      if (adminNote) order.returnAdminNote = adminNote.trim();
      if (rejectionReason) order.returnRejectionReason = rejectionReason.trim();
      if (customerMessage) order.returnCustomerMessage = customerMessage.trim();

      if (targetStatusNorm === "Approved" || targetStatusNorm === "Refunded") {
        order.orderStatus = "Returned";
        await restoreStockForItems(order.items);
        order.stockRestored = true;

        order.items.forEach((i) => {
          if (i.itemStatus !== "Cancelled") {
            i.itemStatus = "Returned";
            i.returnStatus = targetDbStatus;
          }
        });

        // Refund full amount to wallet if not already refunded — idempotency guard
        if (!order.walletRefunded) {
          const refundAmount = Number(order.totalAmount) || 0;

          if (refundAmount > 0) {
            // Mark refunded BEFORE crediting to prevent double-credit
            order.walletRefunded = true;
            order.paymentStatus = "Refunded";

            await User.findByIdAndUpdate(order.user?._id || order.user, {
              $inc: { wallet: refundAmount },
            });
            try {
              const uniqueSuffix = Date.now().toString().slice(-4);
              await WalletTransaction.create({
                user: order.user?._id || order.user,
                transactionId: `TXN-${order._id.toString().slice(-6).toUpperCase()}-${uniqueSuffix}-REF`,
                type: "CREDIT",
                amount: refundAmount,
                title: `Refund from Order #${order.orderNumber}`,
                description: `Full Order Return Approved — ELARQUE Wallet Credit`,
                status: "COMPLETED",
                paymentRail: "ELARQUE Wallet Refund",
                order: order._id,
                orderNumber: order.orderNumber,
                referenceProtocol: "ELG-VLT-RESERVE-2026",
                date: new Date(),
              });
            } catch (txErr) {
              console.error("WARNING: Failed to log full return refund tx:", txErr.message);
            }
          }
        }
      } else if (targetStatusNorm === "Rejected") {
        order.items.forEach((i) => {
          if (i.itemStatus === "ReturnRequested") {
            i.itemStatus = "Active";
            i.returnStatus = "Rejected";
          }
        });
      }
    }

    if (targetStatusNorm === "Picked Up") {
      order.returnPickedUpAt = now;
    } else if (targetStatusNorm === "Refunded") {
      order.returnCompletedAt = now;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Return status successfully transitioned to "${targetStatusNorm}".`,
      order,
    });
  } catch (error) {
    console.error("UPDATE RETURN STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the return disposition.",
    });
  }
};


// QUICK ACTION (Approve or Reject Modal on Return Requests Page)
// PATCH /api/admin/returns/:id/action
// Body: { action: "APPROVE" | "REJECT", rejectionReason, adminNote }

exports.handleQuickReturnAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason = "", adminNote = "" } = req.body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "APPROVE" or "REJECT".',
      });
    }

    const targetStatus = action === "APPROVE" ? "Approved" : "Rejected";

    req.body.status = targetStatus;
    req.body.rejectionReason = rejectionReason;
    req.body.adminNote = adminNote;

    return exports.updateReturnStatus(req, res);
  } catch (error) {
    console.error("QUICK RETURN ACTION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while performing the return action.",
    });
  }
};
