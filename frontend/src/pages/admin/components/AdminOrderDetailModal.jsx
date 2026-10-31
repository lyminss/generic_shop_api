import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  MapPin,
  CheckCircle2,
  Coffee,
  Receipt,
  CreditCard,
  User,
  UserCheck,
  Truck,
  Ban,
  AlertTriangle,
  Printer,
  Tag,
  Copy,
  Phone,
  Sparkles,
  Check,
} from 'lucide-react';
import { formatPrice, formatDateTime, formatTimeAgo } from '../../../utils/format';
import PrintBillModal from '../../../components/common/PrintBillModal';
import { orderService } from '../../../services/api';
import {
  ORDER_STATUS_CONFIG,
  normalizeOrderStatus,
  getOrderChannel,
  getOrderCustomerInfo,
} from '../../../utils/orderHelpers';
import { useToast } from '../../../context/ToastContext';
import './AdminOrderDetailModal.css';

const STATUS_CFG = ORDER_STATUS_CONFIG;
const normalizeStatus = normalizeOrderStatus;
const getChannel = getOrderChannel;

const getBaristaStatusInfo = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'READY' || s === 'COMPLETED')
    return { label: 'Đã pha xong', cls: 'barista-badge--done', icon: CheckCircle2 };
  if (s === 'PREPARING')
    return { label: 'Đang pha chế', cls: 'barista-badge--brewing', icon: Coffee };
  if (s === 'CANCEL' || s === 'CANCELLED')
    return { label: 'Đã hủy', cls: 'barista-badge--cancel', icon: Ban };
  return { label: 'Chờ pha', cls: 'barista-badge--pending', icon: Clock };
};

const ORDER_STEPS = [
  { key: 'NEW',        label: 'Tiếp nhận',  sub: 'Chờ duyệt' },
  { key: 'PROCESSING', label: 'Pha chế',     sub: 'Barista thực hiện' },
  { key: 'SHIPPING',   label: 'Giao hàng',  sub: 'Đang giao' },
  { key: 'COMPLETED',  label: 'Hoàn tất',   sub: 'Đã nhận tiền' },
];

const AdminOrderDetailModal = ({ order, onClose, onUpdateStatus }) => {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [showPrintBill, setShowPrintBill] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const toast = useToast();

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(order.id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm(`Xác nhận đã nhận đủ ${formatPrice(order.totalPrice)} cho đơn #${order.id}?`)) return;
    setProcessing(true);
    try {
      await orderService.confirmPayment(order.id);
      order.paymentStatus = 'PAID';
      toast?.success(`Đã xác nhận thanh toán đơn #${order.id}`);
      if (onUpdateStatus) onUpdateStatus(order.id, order.orderStatus);
    } catch {
      toast?.error('Không thể xác nhận thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showPrintBill) setShowPrintBill(false);
        else if (lightboxPhoto) setLightboxPhoto(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxPhoto, showPrintBill, onClose]);

  const barista = useMemo(() => {
    if (!order) return { done: 0, total: 0, percentage: 0, isComplete: false, label: '0/0' };
    const items = order.items ?? [];
    const total = items.reduce((s, i) => s + (i.quantity || 1), 0);
    const done = items
      .filter((i) => i.preparedStatus === 'READY' || i.preparedStatus === 'COMPLETED')
      .reduce((s, i) => s + (i.quantity || 1), 0);
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percentage, isComplete: total > 0 && done === total, label: `${done}/${total}` };
  }, [order]);

  if (!order) return null;

  const normStatus   = normalizeStatus(order.orderStatus);
  const statusCfg    = STATUS_CFG[normStatus] || STATUS_CFG.NEW;
  const channel      = getChannel(order.shippingAddress);
  const custInfo     = getOrderCustomerInfo(order);
  const ChannelIcon  = channel.icon;
  const isCompleted  = normStatus === 'COMPLETED';
  const isCancelled  = normStatus === 'CANCEL';
  const isPaid       = (
    order.paymentStatus === 'PAID' ||
    isCompleted ||
    (channel.isPos && order.paymentMethod !== 'QR_TRANSFER')
  );
  const hasVoucher   = Boolean(order.voucherCode);
  const originalAmt  = order.originalPrice || (order.totalPrice + (order.discountAmount || 0));

  const STEP_INDEX_MAP = { NEW: 0, PROCESSING: 1, SHIPPING: 2, COMPLETED: 3 };
  const currentStepIndex = isCancelled ? -1 : (STEP_INDEX_MAP[normStatus] ?? 0);

  const handleUpdate = async (nextStatus) => {
    if (nextStatus === 'CANCEL') { setShowCancelForm(true); return; }
    if (!onUpdateStatus) return;
    setProcessing(true);
    try { await onUpdateStatus(order.id, nextStatus); }
    finally { setProcessing(false); }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim() && !window.confirm('Chắc chắn hủy đơn hàng này?')) return;
    if (!onUpdateStatus) return;
    setProcessing(true);
    try {
      await onUpdateStatus(order.id, 'CANCEL');
      setShowCancelForm(false);
      toast?.info(`Đã hủy đơn hàng #${order.id}`);
    } finally { setProcessing(false); }
  };

  const getNextActions = () => {
    if (isCancelled || isCompleted) return [];
    if (normStatus === 'NEW')        return [{ label: 'Duyệt & Pha chế', value: 'PROCESSING', icon: Coffee,       cls: 'odm-action--purple' }];
    if (normStatus === 'PROCESSING') return [{ label: 'Giao hàng',        value: 'SHIPPING',   icon: Truck,        cls: 'odm-action--teal'   }];
    if (normStatus === 'SHIPPING')   return [{ label: 'Hoàn thành',       value: 'COMPLETED',  icon: CheckCircle2, cls: 'odm-action--emerald' }];
    return [];
  };
  const actions = getNextActions();

  return createPortal(
    <>
      {/* ── Backdrop ── */}
      <div className="odm-backdrop" onClick={onClose} role="presentation">
        <div
          className="odm-shell"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Chi tiết đơn hàng #${order.id}`}
        >
          {/* ══ HEADER ══ */}
          <header className="odm-header">
            <div className="odm-header-left">
              <div className="odm-header-icon">
                <Receipt size={18} />
              </div>
              <div>
                <div className="odm-header-title-row">
                  <span className="odm-order-id">
                    Đơn #{String(order.id).padStart(4, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="odm-copy-btn"
                    title="Sao chép mã đơn"
                  >
                    {copiedId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                  <span className={`odm-status-pill ${statusCfg.badgeCls}`}>
                    <span className={`odm-status-dot ${statusCfg.dotCls}`} />
                    {statusCfg.label}
                  </span>
                  <span className={`odm-channel-pill ${channel.isPos ? 'pos' : 'online'}`}>
                    <ChannelIcon size={11} />
                    {channel.label}
                  </span>
                </div>
                <p className="odm-header-meta">
                  <Clock size={11} />
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span className="odm-dot-sep">·</span>
                  <span className="odm-time-ago">{formatTimeAgo(order.createdAt)}</span>
                </p>
              </div>
            </div>

            <div className="odm-header-right">
              <button
                type="button"
                onClick={() => setShowPrintBill(true)}
                className="odm-btn-ghost"
              >
                <Printer size={14} className="text-amber-600" />
                <span>In bill</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="odm-btn-close"
                aria-label="Đóng"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* ══ BODY ══ */}
          <div className="odm-body">

            {/* — 1. Stepper — */}
            {!isCancelled ? (
              <div className="odm-stepper-wrap">
                <div className="odm-stepper-label">
                  <Sparkles size={12} />
                  Tiến trình xử lý đơn hàng
                </div>
                <div className="odm-stepper">
                  {ORDER_STEPS.map((step, idx) => {
                    const isDone    = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;
                    return (
                      <div key={step.key} className="odm-step">
                        {/* connector line before (skip first) */}
                        {idx > 0 && (
                          <div className={`odm-step-line ${isDone ? 'done' : ''}`} />
                        )}
                        <div className={`odm-step-node ${isDone ? 'done' : isCurrent ? 'current' : 'idle'}`}>
                          {isDone ? <Check size={13} /> : idx + 1}
                        </div>
                        <span className={`odm-step-name ${isCurrent ? 'current' : isDone ? 'done' : 'idle'}`}>
                          {step.label}
                        </span>
                        <span className="odm-step-sub">{step.sub}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="odm-cancelled-banner">
                <Ban size={16} className="flex-shrink-0" />
                <div>
                  <strong>Đơn hàng đã bị hủy</strong>
                  <p>Không còn hiệu lực pha chế hoặc giao dịch.</p>
                </div>
              </div>
            )}

            {/* — 2. Info Cards (3 cols) — */}
            <div className="odm-info-grid">
              {/* Card: Khách hàng */}
              <div className="odm-info-card odm-info-card--purple">
                <span className="odm-info-card__eyebrow">
                  {custInfo.isPos ? 'Nhân viên tạo đơn' : 'Khách hàng'}
                </span>
                <p className="odm-info-card__value" title={custInfo.title}>
                  {custInfo.isPos ? <UserCheck size={13} className="inline mr-1 opacity-60" /> : <User size={13} className="inline mr-1 opacity-60" />}
                  {custInfo.title}
                </p>
                <p className="odm-info-card__sub">
                  {order.customerPhone
                    ? <><Phone size={10} className="inline mr-0.5" />{order.customerPhone}</>
                    : custInfo.subtitle}
                </p>
              </div>

              {/* Card: Địa chỉ */}
              <div className="odm-info-card odm-info-card--teal">
                <span className="odm-info-card__eyebrow">
                  {channel.isPos ? 'Vị trí' : 'Giao đến'}
                </span>
                <p className="odm-info-card__value">
                  <MapPin size={13} className="inline mr-1 opacity-60" />
                  {channel.isPos ? 'Tại quầy / Mang về' : (order.shippingAddress || 'Nhận tại quầy')}
                </p>
                <p className="odm-info-card__sub">
                  {channel.isPos ? 'Bán trực tiếp POS' : 'Giao hàng tận nơi'}
                </p>
              </div>

              {/* Card: Thanh toán */}
              <div className={`odm-info-card ${isPaid ? 'odm-info-card--emerald' : 'odm-info-card--amber'}`}>
                <span className="odm-info-card__eyebrow">Thanh toán</span>
                <p className="odm-info-card__value">
                  <CreditCard size={13} className="inline mr-1 opacity-60" />
                  {order.paymentMethod === 'QR_TRANSFER' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}
                </p>
                <p className="odm-info-card__sub">
                  {isPaid
                    ? <span className="odm-paid-chip paid">✔ Đã nhận tiền</span>
                    : <span className="odm-paid-chip unpaid">
                        ⚠ {order.paymentMethod === 'QR_TRANSFER' ? 'Chờ duyệt' : 'Chưa thu tiền'}
                      </span>}
                </p>
              </div>
            </div>

            {/* — 3. Voucher Banner (chỉ hiện khi có) — */}
            {hasVoucher && (
              <div className="odm-voucher-banner">
                <div className="odm-voucher-icon"><Tag size={16} /></div>
                <div className="odm-voucher-body">
                  <span className="odm-voucher-eyebrow">Mã giảm giá đã dùng</span>
                  <div className="odm-voucher-row">
                    <span className="odm-voucher-code">{order.voucherCode}</span>
                    {order.discountAmount > 0 && (
                      <span className="odm-voucher-saving">
                        Tiết kiệm {formatPrice(order.discountAmount)}
                      </span>
                    )}
                  </div>
                  {order.discountAmount > 0 && (
                    <p className="odm-voucher-detail">
                      Giá gốc {formatPrice(originalAmt)} → Sau giảm {formatPrice(order.totalPrice)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* — 4. QR Alert — */}
            {order.paymentMethod === 'QR_TRANSFER' && order.paymentStatus !== 'PAID' && (
              <div className="odm-qr-alert">
                <div className="odm-qr-alert__text">
                  <CreditCard size={16} className="flex-shrink-0 text-amber-700" />
                  <div>
                    <strong>Thanh toán qua VietQR</strong>
                    <p>Kiểm tra ngân hàng xem tiền đã về chưa trước khi bàn giao món.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleConfirmPayment}
                  className="odm-qr-confirm-btn"
                >
                  ✓ Xác nhận đã nhận tiền
                </button>
              </div>
            )}

            {/* — 5. Barista Progress — */}
            <div className="odm-barista-card">
              <div className="odm-barista-header">
                <div className="odm-barista-title">
                  <Coffee size={15} />
                  <span>Tiến độ pha chế</span>
                  <span className="odm-barista-count">{barista.label} ly xong</span>
                </div>
                <span className={`odm-barista-pct ${barista.isComplete ? 'complete' : ''}`}>
                  {barista.percentage}%
                </span>
              </div>
              <div className="odm-progress-track">
                <div
                  className={`odm-progress-fill ${barista.isComplete ? 'complete' : ''}`}
                  style={{ width: `${barista.percentage}%` }}
                />
              </div>
            </div>

            {/* — 6. Items Table — */}
            <div className="odm-items-wrap">
              <div className="odm-items-header">
                <span>Danh sách món — {order.items?.length || 0} loại</span>
                <span>Tổng {barista.total} ly</span>
              </div>
              <div className="odm-items-scroll">
                <table className="odm-items-table">
                  <thead>
                    <tr>
                      <th>Tên món & Ghi chú</th>
                      <th className="text-center">SL</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Thành tiền</th>
                      <th className="text-center">Trạng thái pha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => {
                      const st = getBaristaStatusInfo(item.preparedStatus);
                      const SI = st.icon;
                      return (
                        <tr key={item.id ?? idx}>
                          <td>
                            <div className="odm-item-cell">
                              <div
                                className="odm-item-thumb"
                                onClick={() => item.productImage && setLightboxPhoto(item.productImage)}
                                title={item.productImage ? 'Bấm để phóng to' : undefined}
                              >
                                {item.productImage
                                  ? <img src={item.productImage} alt={item.productName} loading="lazy" />
                                  : <span>🧋</span>}
                              </div>
                              <div>
                                <p className="odm-item-name">{item.productName}</p>
                                {item.notes && (
                                  <p className="odm-item-note">📝 {item.notes}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center odm-item-qty">{item.quantity}</td>
                          <td className="text-right odm-item-price">{formatPrice(item.price)}</td>
                          <td className="text-right odm-item-subtotal">{formatPrice(item.subtotal || item.price * item.quantity)}</td>
                          <td className="text-center">
                            <span className={`odm-barista-badge ${st.cls}`}>
                              <SI size={11} />
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* — 7. Financial Summary — */}
            <div className="odm-summary-wrap">
              <div className="odm-summary-box">
                <div className="odm-summary-title">Tóm tắt thanh toán</div>
                <div className="odm-summary-rows">
                  <div className="odm-summary-row">
                    <span>Tiền món{hasVoucher ? ' (chưa giảm)' : ''}:</span>
                    <span className="odm-summary-mono">{formatPrice(originalAmt)}</span>
                  </div>
                  <div className="odm-summary-row">
                    <span>Phí giao hàng:</span>
                    <span className="odm-summary-free">Freeship ✓</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="odm-summary-row odm-summary-row--discount">
                      <span>
                        Giảm giá
                        {order.voucherCode && (
                          <code className="odm-inline-code">{order.voucherCode}</code>
                        )}:
                      </span>
                      <span className="odm-summary-mono">−{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  {hasVoucher && !order.discountAmount && (
                    <div className="odm-summary-row odm-summary-row--voucher-only">
                      <span><Tag size={10} className="inline mr-1" />{order.voucherCode}</span>
                      <span className="text-stone-400 text-[10px]">Đã áp dụng</span>
                    </div>
                  )}
                </div>
                <div className="odm-summary-total">
                  <span>Tổng cộng</span>
                  <span className="odm-summary-total-amt">{formatPrice(order.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* — 8. Cancel Form — */}
            {showCancelForm && (
              <div className="odm-cancel-form">
                <div className="odm-cancel-form__title">
                  <AlertTriangle size={14} />
                  Xác nhận hủy đơn #{order.id}
                </div>
                <p className="odm-cancel-form__hint">Chọn nhanh lý do hoặc nhập tự do:</p>
                <div className="odm-cancel-chips">
                  {['Khách yêu cầu hủy', 'Hết nguyên liệu', 'Không liên hệ được khách', 'Thay đổi món'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      className={`odm-cancel-chip ${cancelReason === r ? 'selected' : ''}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy chi tiết..."
                  className="odm-cancel-textarea"
                />
                <div className="odm-cancel-actions">
                  <button
                    type="button"
                    onClick={() => setShowCancelForm(false)}
                    className="odm-btn-ghost"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleConfirmCancel}
                    className="odm-cancel-confirm-btn"
                  >
                    {processing ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══ FOOTER ══ */}
          <footer className="odm-footer">
            <div className="odm-footer-left">
              <button
                type="button"
                onClick={() => setShowPrintBill(true)}
                className="odm-btn-ghost"
              >
                <Printer size={14} className="text-amber-600" />
                In hóa đơn
              </button>
              {!isCancelled && !isCompleted && !showCancelForm && (
                <button
                  type="button"
                  onClick={() => setShowCancelForm(true)}
                  className="odm-btn-danger-ghost"
                >
                  <Ban size={13} />
                  Hủy đơn
                </button>
              )}
            </div>

            <div className="odm-footer-right">
              {actions.map((act) => {
                const AI = act.icon;
                return (
                  <button
                    key={act.value}
                    type="button"
                    disabled={processing}
                    onClick={() => handleUpdate(act.value)}
                    className={`odm-action-btn ${act.cls}`}
                  >
                    <AI size={14} />
                    {processing ? 'Đang xử lý...' : act.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onClose}
                className="odm-btn-ghost"
              >
                Đóng
              </button>
            </div>
          </footer>
        </div>
      </div>

      {showPrintBill && (
        <PrintBillModal isOpen order={order} onClose={() => setShowPrintBill(false)} />
      )}

      {lightboxPhoto && (
        <div
          className="odm-lightbox"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="odm-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="odm-lightbox-close"
            >
              <X size={20} />
            </button>
            <img src={lightboxPhoto} alt="Ảnh phóng to" className="odm-lightbox-img" />
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default AdminOrderDetailModal;
