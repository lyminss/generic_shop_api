import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, CheckCircle, CupSoda } from 'lucide-react';
import { formatPrice, formatDateTime } from '../../utils/format';
import './PrintBillModal.css';

const PrintBillModal = ({ isOpen, onClose, order }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentLabel = (method) => {
    if (method === 'CASH') return 'Tiền mặt (CASH)';
    if (method === 'QR_TRANSFER') return 'Chuyển khoản QR (VietQR)';
    return method || 'Tiền mặt';
  };

  return createPortal(
    <div className="print-modal-backdrop" onClick={onClose}>
      <div className="print-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header action bar (hidden when printing) */}
        <div className="print-modal-actions no-print">
          <div className="print-actions-left">
            <span className="print-badge"><CheckCircle size={14} /> Sẵn sàng in</span>
            <span className="print-note">Khổ in: Tiêu chuẩn 80mm / A5 / A4</span>
          </div>
          <div className="print-actions-right">
            <button
              type="button"
              className="btn-print-action"
              onClick={handlePrint}
              autoFocus
            >
              <Printer size={16} /> In hóa đơn ngay
            </button>
            <button
              type="button"
              className="btn-close-action"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div className="print-bill-wrapper" id="mintea-bill-print">
          {/* Header Receipt */}
          <div className="bill-header">
            <div className="bill-logo">🧋</div>
            <h2 className="bill-store-name">MinTea</h2>
            <p className="bill-store-sub">Artisanal Brews & Café</p>
            <p className="bill-meta">123 Đường Cà Phê, P. Bến Nghé, Quận 1, TP.HCM</p>
            <p className="bill-meta">Hotline: 1900 6868 • Wifi: MinTea_Free</p>
          </div>

          <div className="bill-divider" />

          {/* Title */}
          <div className="bill-title-box">
            <h3 className="bill-title">HÓA ĐƠN BÁN HÀNG</h3>
            <p className="bill-order-id">Mã đơn: #{order.id}</p>
            <p className="bill-date">{formatDateTime(order.createdAt || new Date().toISOString())}</p>
          </div>

          {/* Customer info */}
          <div className="bill-info-section">
            <div className="bill-info-row">
              <span className="bill-info-label">Khách hàng:</span>
              <span className="bill-info-val">{order.customerName || 'Khách vãng lai'}</span>
            </div>
            {order.customerPhone && (
              <div className="bill-info-row">
                <span className="bill-info-label">Điện thoại:</span>
                <span className="bill-info-val">{order.customerPhone}</span>
              </div>
            )}
            <div className="bill-info-row">
              <span className="bill-info-label">Địa chỉ/Bàn:</span>
              <span className="bill-info-val">{order.shippingAddress || 'Tại quán'}</span>
            </div>
            <div className="bill-info-row">
              <span className="bill-info-label">Hình thức:</span>
              <span className="bill-info-val">{getPaymentLabel(order.paymentMethod)}</span>
            </div>
          </div>

          <div className="bill-divider" />

          {/* Table items */}
          <table className="bill-items-table">
            <thead>
              <tr>
                <th className="th-name">Món</th>
                <th className="th-qty">SL</th>
                <th className="th-price">Đ.Giá</th>
                <th className="th-total">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => {
                const pName = item.productName || item.product?.name || 'Món nước';
                const qty = item.quantity || 1;
                const price = item.price || item.product?.price || 0;
                return (
                  <tr key={idx}>
                    <td className="td-name">
                      <div className="item-name-text">{pName}</div>
                      {item.note && <div className="item-note-text">({item.note})</div>}
                    </td>
                    <td className="td-qty">{qty}</td>
                    <td className="td-price">{formatPrice(price).replace('₫', '')}</td>
                    <td className="td-total">{formatPrice(price * qty).replace('₫', '')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="bill-divider" />

          {/* Summary / Total */}
          <div className="bill-summary">
            {order.originalPrice && order.discountAmount && order.discountAmount > 0 ? (
              <>
                <div className="summary-row">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(order.originalPrice)}</span>
                </div>
                <div className="summary-row discount-row">
                  <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}:</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              </>
            ) : null}

            <div className="summary-row total-row">
              <span className="total-label">TỔNG CỘNG:</span>
              <span className="total-amount">{formatPrice(order.totalPrice)}</span>
            </div>

            <div className="summary-row payment-status">
              <span>Trạng thái:</span>
              <span className="status-highlight">
                {order.orderStatus === 'COMPLETED' ? 'ĐÃ HOÀN THÀNH' : (order.orderStatus === 'CANCEL' ? 'ĐÃ HỦY' : 'ĐÃ XÁC NHẬN')}
              </span>
            </div>
          </div>

          <div className="bill-divider-double" />

          {/* Footer note */}
          <div className="bill-footer">
            <p className="bill-thanks">Cảm ơn Quý Khách & Hẹn Gặp Lại!</p>
            <p className="bill-qr-note">Pass Wifi: mintea888 • Hotline góp ý: 1900 6868</p>
            <div className="bill-barcode-stub">
              *ORD-{order.id}-{new Date().getFullYear()}*
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PrintBillModal;
