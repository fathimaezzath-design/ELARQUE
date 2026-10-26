const Offer = require("../models/Offer");

/**
 * Fetch all currently active offers within their valid date window.
 */
async function getActiveOffers() {
  const now = new Date();
  return await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();
}

/**
 * Calculate the best offer for a given product by comparing product-specific
 * offers and category offers, applying the LARGEST discount between them.
 *
 * @param {Object} product - Product document or object (must have _id, price, categoryId)
 * @param {Array} activeOffers - Pre-fetched list of active offers (optional)
 * @returns {Object} { finalPrice, originalPrice, discountAmount, appliedOffer }
 */
function evaluateProductOffer(product, activeOffers = []) {
  if (!product) return null;

  const originalPrice = Number(product.price) || 0;
  let bestProductDiscount = 0;
  let bestProductOffer = null;

  let bestCategoryDiscount = 0;
  let bestCategoryOffer = null;

  const prodIdStr = (product._id || product.id || "").toString();
  const catIdStr = (
    product.categoryId?._id ||
    product.categoryId ||
    ""
  ).toString();

  for (const offer of activeOffers) {
    if (offer.targetClass === "product") {
      const isTargeted = offer.targetProducts?.some(
        (tp) => (tp._id || tp).toString() === prodIdStr
      );
      if (isTargeted) {
        let disc = 0;
        if (offer.offerType === "percentage") {
          disc = (originalPrice * Number(offer.discountValue)) / 100;
        } else {
          disc = Number(offer.discountValue);
        }
        disc = Math.min(disc, originalPrice);
        if (disc > bestProductDiscount) {
          bestProductDiscount = disc;
          bestProductOffer = offer;
        }
      }
    } else if (offer.targetClass === "category") {
      const isTargeted = offer.targetCategories?.some(
        (tc) => (tc._id || tc).toString() === catIdStr
      );
      if (isTargeted) {
        let disc = 0;
        if (offer.offerType === "percentage") {
          disc = (originalPrice * Number(offer.discountValue)) / 100;
        } else {
          disc = Number(offer.discountValue);
        }
        disc = Math.min(disc, originalPrice);
        if (disc > bestCategoryDiscount) {
          bestCategoryDiscount = disc;
          bestCategoryOffer = offer;
        }
      }
    }
  }

  // Requirement: Apply the largest between product and category offer
  let appliedOffer = null;
  let discountAmount = 0;

  if (bestCategoryDiscount > bestProductDiscount) {
    appliedOffer = {
      _id: bestCategoryOffer._id,
      title: bestCategoryOffer.title,
      code: bestCategoryOffer.code,
      targetClass: "category",
      offerType: bestCategoryOffer.offerType,
      discountValue: bestCategoryOffer.discountValue,
      discountAmount: Math.round(bestCategoryDiscount),
    };
    discountAmount = Math.round(bestCategoryDiscount);
  } else if (bestProductDiscount > 0) {
    appliedOffer = {
      _id: bestProductOffer._id,
      title: bestProductOffer.title,
      code: bestProductOffer.code,
      targetClass: "product",
      offerType: bestProductOffer.offerType,
      discountValue: bestProductOffer.discountValue,
      discountAmount: Math.round(bestProductDiscount),
    };
    discountAmount = Math.round(bestProductDiscount);
  }

  const finalPrice = Math.max(originalPrice - discountAmount, 0);

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    appliedOffer,
  };
}

/**
 * Apply the best offer across an array of products.
 */
async function applyOffersToProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const activeOffers = await getActiveOffers();

  return products.map((prod) => {
    const pObj = typeof prod.toObject === "function" ? prod.toObject() : { ...prod };
    const offerResult = evaluateProductOffer(pObj, activeOffers);

    if (offerResult && offerResult.discountAmount > 0) {
      pObj.salePrice = offerResult.finalPrice;
      pObj.offerDiscount = offerResult.discountAmount;
      pObj.appliedOffer = offerResult.appliedOffer;
    }
    return pObj;
  });
}

module.exports = {
  getActiveOffers,
  evaluateProductOffer,
  applyOffersToProducts,
};
