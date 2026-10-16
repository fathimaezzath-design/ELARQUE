/**
 * Formats a numeric amount as Indian Rupee (INR) currency string.
 * @param {number|string} amount - The numeric value to format
 * @returns {string} Formatted price string e.g. "₹1,499"
 */
const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

export default formatPrice;
