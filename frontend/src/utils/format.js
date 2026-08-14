/**
 * Formats a raw price number into a clean Vietnamese Dong (VND) format
 * e.g., 25000 -> 25.000 ₫
 * It avoids fractional decimals like .00 entirely.
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '0 ₫';
  
  // Format as Vietnamese standard representation
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};
