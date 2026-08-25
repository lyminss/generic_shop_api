import { X, Clock, MapPin, Store, Globe, Package, CheckCircle2, Coffee, Bike, Receipt, CreditCard, AlertCircle } from 'lucide-react';
import { formatPrice } from '../../../utils/format';

/* ─── Config ──────────────────────────────────────────────────────── */
const STATUS_CFG = {
  NEW:        { label: 'Đơn mới',         color: 'blue',    dot: '#3b82f6' },
  PROCESSING: { label: 'Đang pha chế',    color: 'amber',   dot: '#f59e0b' },
  SHIPPING:   { label: 'Đang giao hàng',  color: 'indigo',  dot: '#6366f1' },
  COMPLETED:  { label: 'Hoàn thành',      color: 'emerald', dot: '#10b981' },
  CANCEL:     { label: 'Đã hủy',          color: 'rose',    dot: '#f43f5e' },
};

const ORDER_STEPS = [
  { status: 'NEW',        label: 'Tiếp nhận',   icon: Receipt      },
  { status: 'PROCESSING', label: 'Đang pha',    icon: Coffee       },
  { status: 'SHIPPING',   label: 'Đang giao',   icon: Bike         },
  { status: 'COMPLETED',  label: 'Hoàn thành',  icon: CheckCircle2 },
];

const STEP_IDX = { NEW: 0, PROCESSING: 1, SHIPPING: 2, COMPLETED: 3, CANCEL: -1 };

const getChannel = (addr) => {
  if (!addr) return { label: 'Online App', isPos: false };
  const l = addr.toLowerCase();
  return l.includes('pos') || l.includes('tại quầy') || l.includes('quầy')
    ? { label: 'Tại quầy (POS)', isPos: true }
    : { label: 'Online App', isPos: false };
};

/* ─── Component ─────────────────────────────────────────────────── */
const AdminOrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  const statusCfg    = STATUS_CFG[order.orderStatus] || { label: order.orderStatus, color: 'stone', dot: '#78716c' };
  const channel      = getChannel(order.shippingAddress);
  const currentStep  = STEP_IDX[order.orderStatus] ?? 0;
  const isCancelled  = order.orderStatus === 'CANCEL';
  const isCompleted  = order.orderStatus === 'COMPLETED';

  const readyQty  = order.items?.filter(i => i.preparedStatus === 'READY').reduce((s, i) => s + i.quantity, 0) ?? 0;
  const totalQty  = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const baristaProgress = totalQty > 0 ? Math.round((readyQty / totalQty) * 100) : 0;

  return (
    <div
      className="aodm-overlay"
      onClick={onClose}
    >
      <div
        className="aodm-panel"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="aodm-header">
          <div className="aodm-header-left">
            <div className={`aodm-header-icon aodm-icon--${statusCfg.color}`}>
              <Package size={20} />
            </div>
            <div>
              <p className="aodm-eyebrow">Chi tiết đơn hàng</p>
              <h2 className="aodm-title">#{String(order.id).padStart(4, '0')}</h2>
              <p className="aodm-date">
                <Clock size={12} />
                {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <div className="aodm-header-right">
            <span className={`aodm-status-badge aodm-status--${statusCfg.color}`}>
              <span className="aodm-status-dot" style={{ background: statusCfg.dot }} />
              {statusCfg.label}
            </span>
            <button className="aodm-close-btn" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="aodm-body">

          {/* Progress Tracker (hidden when cancelled) */}
          {!isCancelled ? (
            <div className="aodm-section">
              <p className="aodm-section-label">Tiến trình đơn hàng</p>
              <div className="aodm-progress-track-wrap">
                <div className="aodm-progress-track">
                  <div
                    className="aodm-progress-fill"
                    style={{ width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` }}
                  />
                </div>
                <div className="aodm-steps">
                  {ORDER_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const passed  = idx <= currentStep;
                    const current = idx === currentStep;
                    return (
                      <div key={step.status} className={`aodm-step ${passed ? 'aodm-step--passed' : ''} ${current ? 'aodm-step--current' : ''}`}>
                        <div className="aodm-step-dot">
                          <Icon size={13} />
                        </div>
                        <span className="aodm-step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="aodm-cancelled-strip">
              <AlertCircle size={16} />
              <span>Đơn hàng này đã bị hủy</span>
            </div>
          )}

          {/* Info Grid */}
          <div className="aodm-info-grid">
            <div className="aodm-info-cell">
              <span className="aodm-info-label">Kênh đặt</span>
              <span className={`aodm-channel-badge ${channel.isPos ? 'aodm-channel--pos' : 'aodm-channel--online'}`}>
                {channel.isPos ? <Store size={12} /> : <Globe size={12} />}
                {channel.label}
              </span>
            </div>
            <div className="aodm-info-cell">
              <span className="aodm-info-label">Tổng giá trị</span>
              <span className="aodm-info-value aodm-info-price">{formatPrice(order.totalPrice)}</span>
            </div>
            <div className="aodm-info-cell aodm-info-cell--full">
              <span className="aodm-info-label">
                <MapPin size={12} /> Địa chỉ nhận / Ghi chú
              </span>
              <span className="aodm-info-value">{order.shippingAddress || 'Nhận tại quầy'}</span>
            </div>
          </div>

          {/* Barista Progress */}
          {totalQty > 0 && (
            <div className="aodm-section">
              <div className="aodm-barista-header">
                <p className="aodm-section-label">
                  <Coffee size={13} /> Tiến độ barista
                </p>
                <span className={`aodm-barista-badge ${baristaProgress === 100 ? 'aodm-barista-badge--done' : 'aodm-barista-badge--progress'}`}>
                  {readyQty}/{totalQty} ly đã pha
                </span>
              </div>
              <div className="aodm-barista-bar-track">
                <div
                  className={`aodm-barista-bar-fill ${baristaProgress === 100 ? 'aodm-bar--done' : ''}`}
                  style={{ width: `${baristaProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="aodm-section">
            <p className="aodm-section-label">
              <Package size={13} /> Danh sách món ({totalQty} phần)
            </p>
            <div className="aodm-items">
              {order.items?.map(item => {
                const isReady = item.preparedStatus === 'READY';
                return (
                  <div key={item.id} className={`aodm-item ${isReady ? 'aodm-item--ready' : ''}`}>
                    <div className="aodm-item-img">
                      {item.productImage
                        ? <img src={item.productImage} alt={item.productName} />
                        : <span>🧋</span>
                      }
                    </div>
                    <div className="aodm-item-info">
                      <div className="aodm-item-top">
                        <p className="aodm-item-name">{item.productName}</p>
                        <span className={`aodm-item-badge ${isReady ? 'aodm-item-badge--ready' : 'aodm-item-badge--pending'}`}>
                          {isReady ? <><CheckCircle2 size={10} /> Đã pha</> : <><Clock size={10} /> Chờ pha</>}
                        </span>
                      </div>
                      {item.notes && <p className="aodm-item-note">📝 {item.notes}</p>}
                      <p className="aodm-item-qty">{formatPrice(item.price)} × {item.quantity}</p>
                    </div>
                    <span className="aodm-item-total">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="aodm-payment-box">
            <div className="aodm-payment-row">
              <span><CreditCard size={13} /> Tạm tính</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            <div className="aodm-payment-row">
              <span>Phí giao hàng</span>
              <span className="aodm-freeship">Miễn phí</span>
            </div>
            <div className="aodm-payment-divider" />
            <div className="aodm-payment-row aodm-payment-total">
              <span>Tổng thanh toán</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="aodm-footer">
          <p className="aodm-footer-note">
            {isCompleted ? '✅ Đơn hàng đã hoàn thành.' : isCancelled ? '❌ Đơn đã bị hủy bởi khách.' : '🔄 Đơn đang được xử lý.'}
          </p>
          <button className="aodm-close-action" onClick={onClose}>
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminOrderDetailModal;
