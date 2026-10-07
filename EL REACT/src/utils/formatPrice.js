/**
 * Format numerical amount to Indian Rupee (INR) currency string
 * e.g., 4999 -> "₹4,999"
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default formatPrice;
