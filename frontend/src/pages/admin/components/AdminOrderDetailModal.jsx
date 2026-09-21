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
  ChevronRight,
  Phone,
  Sparkles,
  ArrowRight,
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

const STATUS_CFG = ORDER_STATUS_CONFIG;
const normalizeStatus = normalizeOrderStatus;
const getChannel = getOrderChannel;

const getBaristaStatusInfo = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'READY' || s === 'COMPLETED') {
    return { label: 'Đã pha xong', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
  }
  if (s === 'PREPARING') {
    return { label: 'Đang pha chế', badgeCls: 'bg-purple-50 text-purple-700 border-purple-200', icon: Coffee };
  }
  if (s === 'CANCEL' || s === 'CANCELLED') {
    return { label: 'Đã hủy', badgeCls: 'bg-rose-50 text-rose-700 border-rose-200', icon: Ban };
  }
  return { label: 'Chờ pha', badgeCls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
};

const ORDER_STEPS = [
  { key: 'NEW', label: 'Tiếp nhận', sub: 'Chờ duyệt' },
  { key: 'PROCESSING', label: 'Pha chế', sub: 'Barista thực hiện' },
  { key: 'SHIPPING', label: 'Giao hàng', sub: 'Đang giao / Sẵn sàng' },
  { key: 'COMPLETED', label: 'Hoàn tất', sub: 'Đã nhận & thanh toán' },
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
    if (!window.confirm(`Xác nhận quán đã nhận đủ số tiền ${formatPrice(order.totalPrice)} cho đơn #${order.id}?`)) return;
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

  // Keyboard Escape & Body Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showPrintBill) {
          setShowPrintBill(false);
        } else if (lightboxPhoto) {
          setLightboxPhoto(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [lightboxPhoto, showPrintBill, onClose]);

  // Barista Progress
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
  const isPaid = order.paymentStatus === 'PAID' || isCompleted || channel.isPos;

  // Status step index (0: NEW, 1: PROCESSING, 2: SHIPPING, 3: COMPLETED)
  const currentStepIndex = useMemo(() => {
    if (isCancelled) return -1;
    switch (normStatus) {
      case 'NEW': return 0;
      case 'PROCESSING': return 1;
      case 'SHIPPING': return 2;
      case 'COMPLETED': return 3;
      default: return 0;
    }
  }, [normStatus, isCancelled]);

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

  const handleConfirmCancel = async (reasonText) => {
    const finalReason = reasonText || cancelReason;
    if (!finalReason.trim() && !window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    if (!onUpdateStatus) return;
    setProcessing(true);
    try {
      await onUpdateStatus(order.id, 'CANCEL');
      setShowCancelForm(false);
      toast?.info(`Đã hủy đơn hàng #${order.id}`);
    } finally {
      setProcessing(false);
    }
  };

  // Workflow Next Actions
  const getNextActions = () => {
    if (isCancelled || isCompleted) return [];

    if (normStatus === 'NEW') {
      return [
        { label: 'Duyệt & Chuyển pha chế', value: 'PROCESSING', icon: Coffee, cls: 'bg-[#5C4174] hover:bg-[#48335c] text-white shadow-md' },
      ];
    }

    if (normStatus === 'PROCESSING') {
      return [
        { label: 'Sẵn sàng giao / Giao hàng', value: 'SHIPPING', icon: Truck, cls: 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' },
      ];
    }

    if (normStatus === 'SHIPPING') {
      return [
        { label: 'Hoàn thành đơn hàng', value: 'COMPLETED', icon: CheckCircle2, cls: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' },
      ];
    }

    return [];
  };

  const actions = getNextActions();

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* ── 1. Modal Header ── */}
          <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5C4174] flex items-center justify-center font-black flex-shrink-0 shadow-xs">
                <Receipt size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-stone-900 font-mono tracking-tight">
                    Đơn hàng #{String(order.id).padStart(4, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                    title="Sao chép mã đơn"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.badgeCls}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${statusCfg.dotCls}`} />
                    {statusCfg.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    channel.isPos ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-teal-100 text-teal-900 border border-teal-200'
                  }`}>
                    <ChannelIcon size={12} />
                    <span>{channel.label}</span>
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                  <Clock size={12} className="text-stone-400" />
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span>·</span>
                  <span className="text-stone-700 font-medium">({formatTimeAgo(order.createdAt)})</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintBill(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 transition-colors shadow-xs"
                title="In hóa đơn"
              >
                <Printer size={15} className="text-amber-600" />
                <span>In bill</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── 2. Modal Body (Scrollable) ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Workflow Progress Stepper (Timeline) */}
            {!isCancelled ? (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-600" />
                  <span>Tiến trình xử lý đơn hàng</span>
                </div>
                <div className="grid grid-cols-4 gap-2 relative">
                  {ORDER_STEPS.map((step, idx) => {
                    const isDone = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-[#5C4174] text-white ring-4 ring-purple-100 font-extrabold shadow-sm scale-105'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {isDone ? <Check size={14} /> : idx + 1}
                        </div>
                        <span className={`text-xs font-bold leading-tight ${isCurrent ? 'text-[#5C4174]' : isDone ? 'text-stone-800' : 'text-stone-400'}`}>
                          {step.label}
                        </span>
                        <span className="text-[10px] text-stone-500 mt-0.5 hidden sm:inline">
                          {step.sub}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
                <Ban size={18} className="text-rose-600 flex-shrink-0" />
                <div>
                  <strong className="font-bold">Đơn hàng này đã bị hủy.</strong>
                  <p className="text-[11px] text-rose-600 mt-0.5">Không còn hiệu lực pha chế hoặc giao dịch.</p>
                </div>
              </div>
            )}

            {/* 3 Quick Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: Khách hàng */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#5C4174] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {custInfo.isPos ? <UserCheck size={18} /> : <User size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {custInfo.isPos ? 'Nhân viên tạo đơn' : 'Khách hàng'}
                  </span>
                  <p className="text-xs font-black text-stone-900 truncate mt-0.5" title={custInfo.title}>
                    {custInfo.title}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5 flex items-center gap-1">
                    {order.customerPhone ? <><Phone size={10} /> {order.customerPhone}</> : custInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* Card 2: Nhận hàng / Địa chỉ */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {channel.isPos ? 'Vị trí tại quầy' : 'Địa chỉ giao hàng'}
                  </span>
                  <p className="text-xs font-black text-stone-900 line-clamp-2 mt-0.5" title={order.shippingAddress}>
                    {channel.isPos ? 'Dùng tại quầy / Mang về' : (order.shippingAddress || 'Nhận tại quầy')}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {channel.isPos ? 'Bán trực tiếp POS' : 'Giao hàng tận nơi'}
                  </p>
                </div>
              </div>

              {/* Card 3: Thanh toán & Voucher */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-xs flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  <CreditCard size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Thanh toán</span>
                  <p className="text-xs font-black text-stone-900 mt-0.5">
                    {order.paymentMethod === 'QR_TRANSFER' ? 'Chuyển khoản VietQR' : 'Tiền mặt (CASH)'}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {isPaid ? '✔ Đã nhận tiền' : '⚠️ Chờ thanh toán'}
                    </span>
                    {order.voucherCode && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Tag size={9} /> {order.voucherCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Payment Alert Banner */}
            {order.paymentMethod === 'QR_TRANSFER' && order.paymentStatus !== 'PAID' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="text-amber-700 flex-shrink-0" size={20} />
                  <div>
                    <strong className="text-xs font-bold text-amber-900">Đơn hàng thanh toán qua VietQR</strong>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Vui lòng kiểm tra ứng dụng ngân hàng xem tiền đã về tài khoản chưa trước khi bàn giao món.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleConfirmPayment}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex-shrink-0"
                >
                  ✓ Xác nhận đã nhận tiền
                </button>
              </div>
            )}

            {/* Barista Progress Meter */}
            <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coffee size={16} className="text-[#5C4174]" />
                  <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Tiến độ pha chế ({barista.label} ly hoàn thành)
                  </span>
                </div>
                <span className={`text-xs font-black tabular-nums ${barista.isComplete ? 'text-emerald-600' : 'text-[#5C4174]'}`}>
                  {barista.percentage}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    barista.isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#5C4174] to-teal-500'
                  }`}
                  style={{ width: `${barista.percentage}%` }}
                />
              </div>
            </div>

            {/* Drink Items Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Danh sách món ({order.items?.length || 0} loại)
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  Tổng {barista.total} ly
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Tên món & Ghi chú</th>
                      <th className="py-2.5 px-3 text-center">SL</th>
                      <th className="py-2.5 px-4 text-right">Đơn giá</th>
                      <th className="py-2.5 px-4 text-right">Thành tiền</th>
                      <th className="py-2.5 px-4 text-center">Trạng thái pha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {order.items?.map((item, idx) => {
                      const itemStatus = getBaristaStatusInfo(item.preparedStatus);
                      const StatusIcon = itemStatus.icon;

                      return (
                        <tr key={item.id ?? idx} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-11 h-11 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer border border-stone-200"
                                onClick={() => {
                                  if (item.productImage) setLightboxPhoto(item.productImage);
                                }}
                                title="Bấm để xem ảnh phóng to"
                              >
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-base">🧋</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-stone-900 truncate">
                                  {item.productName}
                                </p>
                                {item.notes && (
                                  <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mt-1 w-fit border border-amber-200 font-medium">
                                    📝 {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-stone-800">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-stone-600">
                            {formatPrice(item.price)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                            {formatPrice(item.subtotal || item.price * item.quantity)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${itemStatus.badgeCls}`}>
                              <StatusIcon size={12} />
                              <span>{itemStatus.label}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tiền món:</span>
                  <span className="font-mono font-semibold">
                    {formatPrice(order.originalPrice || order.totalPrice + (order.discountAmount || 0))}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Voucher ({order.voucherCode || 'Ưu đãi'}):</span>
                    <span className="font-mono font-bold">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Phí giao hàng:</span>
                  <span className="font-semibold text-emerald-700">Freeship</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-stone-900 text-sm">Tổng cộng:</span>
                  <span className="font-mono font-black text-lg text-emerald-700">
                    {formatPrice(order.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Inline Cancel Form */}
            {showCancelForm && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle size={15} />
                  <span>Xác nhận hủy đơn hàng #{order.id}</span>
                </div>
                <p className="text-xs text-rose-700">
                  Vui lòng chọn hoặc nhập lý do hủy đơn:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Khách yêu cầu hủy', 'Hết nguyên liệu pha chế', 'Không liên hệ được với khách', 'Thay đổi món khác'].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCancelReason(reason)}
                      className="px-2.5 py-1 bg-white border border-rose-200 text-rose-800 rounded-lg text-xs hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy chi tiết..."
                  className="w-full p-2.5 bg-white border border-rose-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelForm(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-700 hover:bg-stone-100"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleConfirmCancel(cancelReason)}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                  >
                    {processing ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. Modal Footer ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintBill(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-xs font-bold text-stone-800 shadow-xs transition-colors cursor-pointer"
              >
                <Printer size={15} className="text-amber-600" />
                <span>In hóa đơn</span>
              </button>

              {!isCancelled && !isCompleted && !showCancelForm && (
                <button
                  type="button"
                  onClick={() => setShowCancelForm(true)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Ban size={14} className="inline mr-1" />
                  <span>Hủy đơn</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {actions.map((act) => {
                const ActionIcon = act.icon;
                return (
                  <button
                    key={act.value}
                    type="button"
                    disabled={processing}
                    onClick={() => handleUpdate(act.value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${act.cls}`}
                  >
                    <ActionIcon size={15} />
                    <span>{processing ? 'Đang xử lý...' : act.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Bill Modal */}
      {showPrintBill && (
        <PrintBillModal
          isOpen={showPrintBill}
          onClose={() => setShowPrintBill(false)}
          order={order}
        />
      )}

      {/* Image Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <img
              src={lightboxPhoto}
              alt="Ảnh phóng to"
              className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default AdminOrderDetailModal;
