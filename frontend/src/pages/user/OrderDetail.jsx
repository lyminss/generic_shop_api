import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import {
  ArrowLeft, Clock, MapPin, AlertCircle, Package,
  CheckCircle2, Coffee, Bike, Sparkles, Receipt,
  CreditCard, ShoppingBag, X, Loader2, Printer, Tag
} from 'lucide-react';
import PrintBillModal from '../../components/common/PrintBillModal';
import './OrderDetail.css';

const ORDER_STEPS = [
  { status: 'NEW',        label: 'Đã Tiếp Nhận',        desc: 'Đơn hàng đã được ghi nhận',     icon: Receipt },
  { status: 'PROCESSING', label: 'Barista Đang Pha',     desc: 'Thức uống đang được chuẩn bị',  icon: Coffee },
  { status: 'SHIPPING',   label: 'Sẵn Sàng Giao',       desc: 'Đơn hàng đang trên đường đến', icon: Bike },
  { status: 'COMPLETED',  label: 'Hoàn Thành',           desc: 'Cảm ơn quý khách! 🎉',         icon: CheckCircle2 },
];

const STATUS_MAP = {
  NEW:        { label: 'Đơn mới',         color: 'blue' },
  PROCESSING: { label: 'Đang chuẩn bị',   color: 'amber' },
  SHIPPING:   { label: 'Đang giao hàng',  color: 'indigo' },
  COMPLETED:  { label: 'Hoàn thành',      color: 'emerald' },
  CANCEL:     { label: 'Đã hủy',          color: 'rose' },
};

const getStepIndex = (status) => {
  const map = { NEW: 0, PROCESSING: 1, SHIPPING: 2, COMPLETED: 3, CANCEL: -1 };
  return map[status] ?? 0;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showPrintBill, setShowPrintBill] = useState(false);
  const toast = useToast();

  const fetchOrderDetail = async () => {
    try {
      const res = await orderService.getOrderById(id);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to fetch order details', err);
      toast.error('Không thể tải thông tin chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    const interval = setInterval(fetchOrderDetail, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    setCancelLoading(true);
    try {
      await orderService.cancelOrder(id);
      toast.success('Hủy đơn hàng thành công!');
      fetchOrderDetail();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể hủy đơn hàng.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="od-loading">
        <Loader2 size={36} className="od-spinner" />
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="od-not-found">
        <AlertCircle size={52} className="od-not-found-icon" />
        <h2>Không Tìm Thấy Đơn Hàng</h2>
        <p>Đơn hàng #{id} không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate(-1)} className="od-back-btn">
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
      </div>
    );
  }

  const currentStep = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCEL';
  const isCompleted = order.orderStatus === 'COMPLETED';
  const statusInfo = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: 'stone' };
  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <div className="od-page">
      {/* ─── Back Link ─── */}
      <button onClick={() => navigate(-1)} className="od-back-link">
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* ─── Hero Header ─── */}
      <div className={`od-hero ${isCancelled ? 'od-hero--cancelled' : isCompleted ? 'od-hero--completed' : 'od-hero--active'}`}>
        <div className="od-hero-left">
          <div className="od-hero-icon-wrap">
            <ShoppingBag size={22} />
          </div>
          <div>
            <p className="od-hero-eyebrow">Đơn hàng</p>
            <h1 className="od-hero-title">#{order.id}</h1>
            <p className="od-hero-date">
              <Clock size={13} /> {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        <div className="od-hero-right">
          <span className={`od-status-badge od-status-badge--${statusInfo.color}`}>
            {isCancelled ? <X size={13} /> : isCompleted ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
            {statusInfo.label}
          </span>
          <div className="od-hero-meta">
            <span>{totalItems} món</span>
            <span className="od-hero-total">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* ─── Progress Timeline ─── */}
      {!isCancelled && (
        <div className="od-timeline">
          <div className="od-timeline-track">
            <div
              className="od-timeline-fill"
              style={{ width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <div className="od-timeline-steps">
            {ORDER_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const passed = idx <= currentStep;
              const current = idx === currentStep;
              return (
                <div key={step.status} className={`od-step ${passed ? 'od-step--passed' : ''} ${current ? 'od-step--current' : ''}`}>
                  <div className="od-step-dot">
                    <Icon size={16} />
                  </div>
                  <div className="od-step-text">
                    <span className="od-step-label">{step.label}</span>
                    <span className="od-step-desc">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Cancelled Banner ─── */}
      {isCancelled && (
        <div className="od-cancelled-banner">
          <X size={20} />
          <div>
            <strong>Đơn hàng đã bị hủy</strong>
            <p>Nếu bạn đã thanh toán, tiền hoàn trả sẽ được xử lý trong 3-5 ngày làm việc.</p>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="od-body">

        {/* Items */}
        <div className="od-card od-card--main">
          <div className="od-card-header">
            <Package size={17} />
            <h2>Các món đã đặt</h2>
            <span className="od-card-badge">{totalItems} món</span>
          </div>
          <div className="od-items">
            {order.items?.map((item) => (
              <div key={item.id} className="od-item">
                <div className="od-item-img">
                  {item.productImage
                    ? <img src={item.productImage} alt={item.productName} />
                    : <div className="od-item-img-placeholder">🧋</div>
                  }
                </div>
                <div className="od-item-info">
                  <div className="od-item-top">
                    <h3 className="od-item-name">{item.productName}</h3>
                    <span className={`od-item-status ${item.preparedStatus === 'READY' ? 'od-item-status--ready' : 'od-item-status--pending'}`}>
                      {item.preparedStatus === 'READY' ? <><CheckCircle2 size={11} /> Xong</> : <><Clock size={11} /> Đang pha</>}
                    </span>
                  </div>
                  {(item.options || item.notes) && (
                    <p className="od-item-note">✨ {item.options || item.notes}</p>
                  )}
                  <div className="od-item-bottom">
                    <span className="od-item-unit">{formatPrice(item.price)} × {item.quantity}</span>
                    <span className="od-item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="od-sidebar">

          {/* Payment Summary */}
          <div className="od-card">
            <div className="od-card-header">
              <CreditCard size={17} />
              <h2>Tóm tắt thanh toán</h2>
            </div>
            <div className="od-summary">
              <div className="od-summary-row">
                <span>Tạm tính</span>
                <span>{formatPrice(order.originalPrice || order.totalPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="od-summary-row" style={{ color: '#ef4444' }}>
                  <span>Voucher giảm {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="od-summary-row">
                <span>Hình thức</span>
                <span style={{ fontWeight: 600 }}>
                  {order.paymentMethod === 'QR_TRANSFER' ? 'Chuyển khoản QR' : 'Tiền mặt'}
                </span>
              </div>
              <div className="od-summary-row">
                <span>Trạng thái tiền</span>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: order.paymentStatus === 'PAID' ? '#10b981' : (order.paymentStatus === 'WAITING_CONFIRMATION' ? '#d97706' : '#6b7280')
                }}>
                  {order.paymentStatus === 'PAID'
                    ? '✔ Đã xác nhận tiền'
                    : (order.paymentStatus === 'WAITING_CONFIRMATION'
                      ? '⏳ Chờ thu ngân kiểm tra tiền'
                      : 'Chưa thanh toán')}
                </span>
              </div>
              <div className="od-summary-row">
                <span>Phí giao hàng</span>
                <span className="od-freeship">Miễn phí 🎁</span>
              </div>
              <div className="od-summary-divider" />
              <div className="od-summary-row od-summary-row--total">
                <span>Tổng thanh toán</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>

              {order.paymentMethod === 'QR_TRANSFER' && order.paymentStatus === 'WAITING_CONFIRMATION' && (
                <div style={{
                  marginTop: '0.65rem',
                  padding: '0.6rem 0.75rem',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#92400e',
                  lineHeight: 1.4
                }}>
                  ⏳ <strong>Đang chờ kiểm tra tiền:</strong> Quán đang đối soát số dư tài khoản ngân hàng. Món sẽ được pha chế ngay sau khi tiền vào tài khoản!
                </div>
              )}
            </div>

            <button
              type="button"
              className="od-print-btn"
              onClick={() => setShowPrintBill(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                width: '100%',
                padding: '0.65rem 1rem',
                marginTop: '0.75rem',
                borderRadius: '9999px',
                border: '1px solid #f59e0b',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={16} /> In hóa đơn
            </button>

            {order.orderStatus === 'NEW' && (
              <button
                className="od-cancel-btn"
                onClick={handleCancelOrder}
                disabled={cancelLoading}
              >
                {cancelLoading ? <><Loader2 size={15} className="od-spinner-sm" /> Đang hủy...</> : <><X size={15} /> Hủy đơn hàng</>}
              </button>
            )}
          </div>

          {/* Delivery Info */}
          <div className="od-card">
            <div className="od-card-header">
              <MapPin size={17} />
              <h2>Địa chỉ nhận món</h2>
            </div>
            <p className="od-address">
              {order.shippingAddress || 'Nhận tại quầy MinTea'}
            </p>
          </div>

        </div>
      </div>

      {showPrintBill && (
        <PrintBillModal
          isOpen={showPrintBill}
          onClose={() => setShowPrintBill(false)}
          order={order}
        />
      )}
    </div>
  );
};

export default OrderDetail;
