import {
  X,
  Receipt,
  Building2,
  Calendar,
  Boxes,
  CreditCard,
  CheckCircle,
  PackageCheck,
} from 'lucide-react';
import { formatPrice, fmtQty } from '../../../utils/format';

const StockReceiptDetailModal = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const totalQty = receipt.details?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) ?? 0;

  return (
    <div className="aodm-overlay" onClick={onClose}>
      <div className="aodm-panel" style={{ maxWidth: '860px', maxHeight: 'calc(100vh - 3rem)' }} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="aodm-header">
          <div className="aodm-header-left">
            <div className="aodm-header-icon" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
              <Receipt size={20} />
            </div>
            <div>
              <p className="aodm-eyebrow">Chi tiết phiếu nhập kho</p>
              <h2 className="aodm-title">{receipt.receiptCode || `#RC-${receipt.id}`}</h2>
              <p className="aodm-date">
                <Calendar size={12} />
                {new Date(receipt.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="aodm-header-right">
            <span className="aodm-status-badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
              <span className="aodm-status-dot" style={{ background: '#059669' }} />
              Đã nhập kho
            </span>
            <button className="aodm-close-btn" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="aodm-body">
          {/* Section 1: Thông tin phiếu nhập */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <Building2 size={13} /> Thông tin phiếu nhập
            </p>
            <div className="aodm-info-grid">
              <div className="aodm-info-cell">
                <span className="aodm-info-label">Nhà cung cấp</span>
                <span className="supplier-tag" style={{ display: 'inline-block', marginTop: '4px' }}>
                  {receipt.supplier || 'Nội bộ / Chưa ghi nhận'}
                </span>
              </div>

              <div className="aodm-info-cell">
                <span className="aodm-info-label">Số mặt hàng nhập</span>
                <span className="aodm-info-value" style={{ fontWeight: 700 }}>
                  {receipt.details?.length || 0} nguyên liệu
                </span>
              </div>

              <div className="aodm-info-cell aodm-info-cell--full">
                <span className="aodm-info-label">Ghi chú</span>
                <span className="aodm-info-value">{receipt.note || 'Không có ghi chú thêm.'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Danh sách nguyên liệu */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <Boxes size={13} /> Chi tiết nguyên liệu nhập kho ({receipt.details?.length || 0} dòng)
            </p>

            <div className="aodm-receipt-table-wrap">
              <table className="aodm-receipt-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Mã NL</th>
                    <th style={{ width: '32%' }}>Tên Nguyên Liệu</th>
                    <th style={{ width: '18%', textAlign: 'right' }}>Số Lượng Nhập</th>
                    <th style={{ width: '18%', textAlign: 'right' }}>Đơn Giá Nhập</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.details?.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span
                          className="aodm-status-badge aodm-status--stone"
                          style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                        >
                          {d.ingredient?.code || `#${d.ingredientId}`}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {d.ingredient?.name || `Nguyên liệu #${d.ingredientId}`}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {fmtQty(d.quantity)} {d.ingredient?.unit || ''}
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>
                        {formatPrice(d.unitPrice)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#065f46' }}>
                        {formatPrice(d.totalPrice || d.quantity * d.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Khung tổng kết thanh toán */}
          <div className="aodm-payment-box">
            <div className="aodm-payment-row">
              <span>
                <Boxes size={13} /> Số nguyên liệu nhập
              </span>
              <span>{receipt.details?.length || 0} loại</span>
            </div>
            <div className="aodm-payment-row">
              <span>
                <PackageCheck size={13} /> Tổng số lượng
              </span>
              <span>{fmtQty(totalQty)} đơn vị</span>
            </div>
            <div className="aodm-payment-divider" />
            <div className="aodm-payment-row aodm-payment-total">
              <span>
                <CreditCard size={15} /> Tổng tiền phiếu nhập
              </span>
              <span>{formatPrice(receipt.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="aodm-footer">
          <div className="aodm-footer-left">
            <CheckCircle size={14} className="text-stone-400" />
            <p className="aodm-footer-note">
              Phiếu nhập kho đã được ghi nhận và tồn kho đã được cập nhật.
            </p>
          </div>
          <div className="aodm-footer-actions">
            <button type="button" className="aodm-btn-cancel" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockReceiptDetailModal;
