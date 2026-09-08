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
} from 'lucide-react';
import { formatPrice, formatDateTime } from '../../../utils/format';
import {
  ORDER_STATUS_CONFIG,
  normalizeOrderStatus,
  getOrderChannel,
  getOrderCustomerInfo,
} from '../../../utils/orderHelpers';

const STATUS_CFG = ORDER_STATUS_CONFIG;
const normalizeStatus = normalizeOrderStatus;
const getChannel = getOrderChannel;

const getBaristaStatusInfo = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'READY' || s === 'COMPLETED') {
    return { label: 'Đã xong', badgeCls: 'badge-completed', icon: CheckCircle2 };
  }
  if (s === 'PREPARING') {
    return { label: 'Đang pha', badgeCls: 'badge-processing', icon: Coffee };
  }
  if (s === 'CANCEL' || s === 'CANCELLED') {
    return { label: 'Đã hủy', badgeCls: 'badge-cancel', icon: Ban };
  }
  return { label: 'Chờ pha', badgeCls: 'badge-new', icon: Clock };
};

const AdminOrderDetailModal = ({ order, onClose, onUpdateStatus }) => {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Keyboard Escape & Body Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxPhoto) {
          setLightboxPhoto(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Lock the real scroll container (.sidebar-content) and window
    const scrollEl = document.querySelector('.sidebar-content');
    const prevScrollOverflow = scrollEl ? scrollEl.style.overflow : '';
    if (scrollEl) scrollEl.style.overflow = 'hidden';
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scrollEl) scrollEl.style.overflow = prevScrollOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [lightboxPhoto, onClose]);

  // Barista Progress (Unconditionally called)
  const barista = useMemo(() => {
    if (!order) return { done: 0, total: 0, percentage: 0, isComplete: false, label: '0/0' };
    const items = order.items ?? [];
    const total = items.reduce((s, i) => s + (i.quantity || 1), 0);
    const done = items
      .filter((i) => i.preparedStatus === 'READY' || i.preparedStatus === 'COMPLETED')
      .reduce((s, i) => s + (i.quantity || 1), 0);

    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = total > 0 && done === total;
    return { done, total, percentage, isComplete, label: `${done}/${total}` };
  }, [order]);

  if (!order) return null;

  const normStatus = normalizeStatus(order.orderStatus);
  const statusCfg = STATUS_CFG[normStatus] || STATUS_CFG.NEW;
  const channel = getChannel(order.shippingAddress);
  const custInfo = getOrderCustomerInfo(order);
  const ChannelIcon = channel.icon;

  const isCompleted = normStatus === 'COMPLETED';
  const isCancelled = normStatus === 'CANCEL';
  const isPaid = isCompleted || channel.isPos;

  // Handle Status Update
  const handleUpdate = async (nextStatus) => {
    if (nextStatus === 'CANCEL') {
      setShowCancelForm(true);
      return;
    }
    if (!onUpdateStatus) return;
    setProcessing(true);
    try {
      await onUpdateStatus(order.id, nextStatus);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim() && !window.confirm('Xác nhận hủy đơn hàng này?')) return;
    if (!onUpdateStatus) return;
    setProcessing(true);
    try {
      await onUpdateStatus(order.id, 'CANCEL');
      setShowCancelForm(false);
    } finally {
      setProcessing(false);
    }
  };

  // Next Actions for Workflow
  const getNextActions = () => {
    if (isCancelled || isCompleted) return [];

    if (normStatus === 'NEW') {
      return [
        { label: 'Xác nhận đơn', value: 'PROCESSING', icon: CheckCircle2, cls: 'btn-primary-action' },
        { label: 'Hủy đơn', value: 'CANCEL', icon: Ban, cls: 'btn-danger-action' },
      ];
    }

    if (normStatus === 'PROCESSING') {
      return [
        { label: 'Bắt đầu giao / Sẵn sàng', value: 'SHIPPING', icon: Truck, cls: 'btn-teal-action' },
        { label: 'Hủy đơn', value: 'CANCEL', icon: Ban, cls: 'btn-danger-action' },
      ];
    }

    if (normStatus === 'SHIPPING') {
      return [
        { label: 'Hoàn thành đơn', value: 'COMPLETED', icon: CheckCircle2, cls: 'btn-success-action' },
      ];
    }

    return [];
  };

  const actions = getNextActions();

  return createPortal(
    <>
      <div
        className="order-modal-backdrop animate-fade-in"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="order-modal-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-heading"
        >
          {/* ── Modal Header ── */}
          <header className="order-modal-header">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <Receipt size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 id="order-modal-heading" className="text-base font-extrabold text-stone-900 tabular-nums">
                    Đơn hàng #{String(order.id).padStart(4, '0')}
                  </h2>

                  <span className={`status-badge ${statusCfg.badgeCls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotCls}`} aria-hidden="true" />
                    {statusCfg.label}
                  </span>

                  <span className={`channel-pill ${channel.isPos ? 'pos' : 'online'}`}>
                    <ChannelIcon size={12} aria-hidden="true" />
                    <span>{channel.label}</span>
                  </span>
                </div>

                <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                  <Clock size={11} aria-hidden="true" />
                  <time dateTime={new Date(order.createdAt).toISOString()}>
                    {formatDateTime(order.createdAt)}
                  </time>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="accessible-action-btn"
              aria-label="Đóng chi tiết đơn hàng"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </header>

          {/* ── Modal Body (Scrollable) ── */}
          <div className="order-modal-body admin-orders-scroll">
            {/* 4 Info Cards Grid */}
            <div className="modal-info-grid" role="region" aria-label="Thông tin nhanh đơn hàng">
              {/* 1. Khách hàng / Người tạo đơn */}
              <div className="modal-info-card">
                <div
                  className={`modal-info-icon-box ${
                    custInfo.isPos ? 'bg-amber-100 text-amber-900' : 'bg-purple-100 text-purple-900'
                  }`}
                  aria-hidden="true"
                >
                  {custInfo.isPos ? <UserCheck size={16} /> : <User size={16} />}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {custInfo.isPos ? 'Nhân viên tạo đơn (POS)' : 'Khách hàng đặt Online'}
                  </span>
                  <p className="text-xs font-bold text-stone-900 truncate mt-0.5" title={custInfo.title}>
                    {custInfo.title}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate" title={custInfo.subtitle}>
                    {custInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* 2. Loại đơn / Kênh */}
              <div className="modal-info-card">
                <div className="modal-info-icon-box bg-amber-100 text-amber-900" aria-hidden="true">
                  <ChannelIcon size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Loại đơn</span>
                  <p className="text-xs font-bold text-stone-900 truncate mt-0.5">{channel.label}</p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {channel.isPos ? 'Bán trực tiếp' : 'Đặt trực tuyến'}
                  </p>
                </div>
              </div>

              {/* 3. Địa chỉ / Bàn */}
              <div className="modal-info-card">
                <div className="modal-info-icon-box bg-teal-100 text-teal-900" aria-hidden="true">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {channel.isPos ? 'Bàn / Vị trí' : 'Địa chỉ giao'}
                  </span>
                  <p className="text-xs font-bold text-stone-900 truncate mt-0.5" title={order.shippingAddress}>
                    {channel.isPos ? 'Tại quầy (POS)' : order.shippingAddress || 'Nhận tại quầy'}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {channel.isPos ? 'Dùng tại chỗ / mang về' : 'Giao hàng tận nơi'}
                  </p>
                </div>
              </div>

              {/* 4. Thanh toán */}
              <div className="modal-info-card">
                <div
                  className={`modal-info-icon-box ${
                    isPaid ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}
                  aria-hidden="true"
                >
                  <CreditCard size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Thanh toán</span>
                  <p className="text-xs font-bold text-stone-900 truncate mt-0.5">
                    {channel.isPos ? 'Tiền mặt / Thẻ POS' : 'COD / Chuyển khoản'}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold ${
                      isPaid ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chi tiết địa chỉ giao hàng (nếu không phải POS) */}
            {!channel.isPos && order.shippingAddress && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/70">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Giao hàng đến</p>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">
                    {order.customerName || order.customerEmail || 'Khách hàng'}
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5 break-words">{order.shippingAddress}</p>
                </div>
              </div>
            )}

            {/* Barista Progress Box */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Coffee size={14} className="text-[#7c5c9c]" aria-hidden="true" />
                    <span>Tiến độ pha chế</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
                    Tổng số {barista.total} sản phẩm trong đơn hàng
                  </p>
                </div>

                <div
                  className={`text-lg font-black tabular-nums ${
                    barista.isComplete ? 'text-emerald-700' : 'text-purple-950'
                  }`}
                >
                  {barista.label}
                </div>
              </div>

              <div className="modal-barista-track" aria-hidden="true">
                <div
                  className={`modal-barista-fill ${barista.isComplete ? 'is-done' : ''}`}
                  style={{ width: `${barista.percentage}%` }}
                />
              </div>
            </div>

            {/* Bảng danh sách món */}
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <table className="admin-data-table w-full">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: '1rem' }}>Món</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                    <th style={{ textAlign: 'center', paddingRight: '1rem' }}>Trạng thái pha</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => {
                    const itemStatus = getBaristaStatusInfo(item.preparedStatus);
                    const StatusIcon = itemStatus.icon;

                    return (
                      <tr key={item.id ?? idx}>
                        {/* Cột 1: Món & Ảnh */}
                        <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center text-lg flex-shrink-0 cursor-pointer"
                              onClick={() => {
                                if (item.productImage) setLightboxPhoto(item.productImage);
                              }}
                              role={item.productImage ? 'button' : undefined}
                              tabIndex={item.productImage ? 0 : undefined}
                              onKeyDown={(e) => {
                                if (item.productImage && (e.key === 'Enter' || e.key === ' ')) {
                                  e.preventDefault();
                                  setLightboxPhoto(item.productImage);
                                }
                              }}
                              aria-label={item.productImage ? `Xem phóng to ảnh ${item.productName}` : undefined}
                            >
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName || 'Ảnh món'}
                                  width={40}
                                  height={40}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span aria-hidden="true">🧋</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-stone-900 truncate">
                                {item.productName}
                              </p>
                              {item.notes && (
                                <p className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded w-fit mt-0.5">
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Số lượng */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded bg-stone-100 font-mono text-xs font-bold text-stone-800 tabular-nums">
                            {item.quantity}
                          </span>
                        </td>

                        {/* Cột 3: Đơn giá */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono text-xs text-stone-600 tabular-nums">
                            {formatPrice(item.price)}
                          </span>
                        </td>

                        {/* Cột 4: Thành tiền */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono text-xs font-bold text-stone-900 tabular-nums">
                            {formatPrice(item.subtotal || item.price * item.quantity)}
                          </span>
                        </td>

                        {/* Cột 5: Trạng thái pha */}
                        <td style={{ textAlign: 'center', paddingRight: '1rem' }}>
                          <span className={`status-badge ${itemStatus.badgeCls}`}>
                            <StatusIcon size={12} aria-hidden="true" />
                            <span>{itemStatus.label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Form Hủy đơn an toàn */}
            {showCancelForm && (
              <div
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 space-y-2 animate-fade-in"
                role="region"
                aria-labelledby="cancel-form-heading"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800">
                  <AlertTriangle size={15} aria-hidden="true" />
                  <span id="cancel-form-heading">Lý do hủy đơn hàng</span>
                </div>
                <label htmlFor="cancel-reason-input" className="sr-only">
                  Nhập lý do hủy đơn hàng
                </label>
                <textarea
                  id="cancel-reason-input"
                  name="cancelReason"
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do khách hủy, hết nguyên liệu hoặc thay đổi món…"
                  className="w-full p-2.5 rounded-lg border border-rose-200 bg-white text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelForm(false)}
                    className="px-3.5 py-1.5 rounded-full border border-stone-300 bg-white text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleConfirmCancel}
                    className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {processing ? 'Đang hủy…' : 'Xác nhận hủy đơn'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Modal Footer (Financials & Actions) ── */}
          <footer className="order-modal-footer">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tổng thanh toán</p>
              <p className="font-mono text-xl font-black text-stone-900 tabular-nums">
                {formatPrice(order.totalPrice)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {actions.map((act) => {
                const ActionIcon = act.icon;
                return (
                  <button
                    key={act.value}
                    type="button"
                    disabled={processing}
                    onClick={() => handleUpdate(act.value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      act.value === 'CANCEL'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : act.value === 'SHIPPING'
                        ? 'bg-teal-700 hover:bg-teal-800 text-white'
                        : act.value === 'COMPLETED'
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-[#5C4174] hover:bg-[#3f1c54] text-white'
                    }`}
                  >
                    <ActionIcon size={14} aria-hidden="true" />
                    <span>{processing ? 'Đang cập nhật…' : act.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Lightbox photo preview */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
          role="presentation"
        >
          <div className="max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Đóng ảnh xem trước"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <img
              src={lightboxPhoto}
              alt="Ảnh chi tiết sản phẩm"
              width={600}
              height={600}
              className="max-h-[80vh] w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default AdminOrderDetailModal;
