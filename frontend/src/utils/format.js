/**
 * Formats a raw price number into a clean Vietnamese Dong (VND) format
 * e.g., 25000 -> 25.000 ₫
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Formats date into relative time ago format
 * e.g., "Vừa xong", "5 phút trước", "2 giờ trước"
 */
export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 10) return 'Vừa xong';
  if (seconds < 60) return `${seconds} giây trước`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

/**
 * Formats date into standard DD/MM/YYYY string
 * e.g., "2026-08-25" -> "25/08/2026"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  // If string in YYYY-MM-DD format, split directly to prevent timezone shifts
  const str = String(dateInput).trim();
  const datePart = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formats date to standard Vietnamese datetime string
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '—';
  return new Date(dateInput).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};/**
 * Formats a stock quantity number cleanly — removes floating-point noise.
 * e.g., 4.970000000000001  → "4.97"
 *       5.0                → "5"
 *       0.025              → "0.025"
 * @param {number} value - the quantity
 * @param {number} [maxDecimals=3] - max decimal places (default 3)
 */
export const fmtQty = (value, maxDecimals = 3) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return parseFloat(Number(value).toFixed(maxDecimals)).toString();
};
