import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import { ArrowLeft, Clock, MapPin, AlertCircle, ShoppingBag, Package, CheckCircle2, Coffee, Bike, Sparkles } from 'lucide-react';
import './OrderDetail.css';

const ORDER_STEPS = [
  { status: 'NEW', label: 'Đã Tiếp Nhận', desc: 'Đơn hàng đã được tạo', icon: Clock },
  { status: 'PROCESSING', label: 'Barista Pha Chế', desc: 'Đang làm đồ uống tươi', icon: Coffee },
  { status: 'SHIPPING', label: 'Đang Giao / Sẵn Sàng', desc: 'Shipper/Khách nhận', icon: Bike },
  { status: 'COMPLETED', label: 'Hoàn Thành', desc: 'Cảm ơn quý khách!', icon: CheckCircle2 },
];

const getStepIndex = (status) => {
  switch (status) {
    case 'NEW': return 0;
    case 'PROCESSING': return 1;
    case 'SHIPPING': return 2;
    case 'COMPLETED': return 3;
    case 'CANCEL': return -1;
    default: return 0;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const toast = useToast();

  const fetchOrderDetail = async () => {
    try {
      const res = await orderService.getOrderById(id);
      setOrder(res.data);
    } catch (err) {
      console.error("Failed to fetch order details", err);
      toast.error("Không thể tải thông tin chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    const interval = setInterval(fetchOrderDetail, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    setCancelLoading(true);
    try {
      await orderService.cancelOrder(id);
      toast.success("Hủy đơn hàng thành công!");
      fetchOrderDetail();
    } catch (err) {
      console.error("Failed to cancel order", err);
      toast.error(err.response?.data || "Không thể hủy đơn hàng.");
    } finally {
      setCancelLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-not-found container py-16 animate-fade-in text-center">
        <AlertCircle size={54} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-2">Không Tìm Thấy Đơn Hàng</h2>
        <p className="text-stone-500 mb-4">Rất tiếc, đơn hàng #{id} không tồn tại hoặc đã bị xóa.</p>
        <Link to="/orders" className="btn-brand">
          <ArrowLeft size={16} /> Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCEL';

  return (
    <div className="order-detail-container container animate-fade-in">
      <Link to="/orders" className="back-link mb-6">
        <ArrowLeft size={18} /> Quay lại Đơn hàng của tôi
      </Link>

      {/* Header Info */}
      <div className="order-detail-header glass-card">
        <div>
          <h1 className="detail-title">Mã Đơn Hàng #{order.id}</h1>
          <p className="detail-date">Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <div>
          {isCancelled ? (
            <span className="badge-cancelled">❌ Đã Hủy Đơn</span>
          ) : (
            <span className="badge-active">✨ Đang Xử Lý</span>
          )}
        </div>
      </div>

      {/* Visual Step Progress Tracker */}
      {!isCancelled && (
        <div className="order-timeline-card glass-card">
          <h3 className="timeline-title"><Sparkles size={16} className="inline text-amber-500 mr-1" /> Tiến Trình Đơn Hàng</h3>
          <div className="timeline-steps">
            {ORDER_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step.status} className={`timeline-step ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <div className="step-info">
                    <span className="step-name">{step.label}</span>
                    <span className="step-desc">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Layout details */}
      <div className="order-detail-layout">
        <div className="detail-main">
          <div className="detail-section glass-card">
            <h2 className="section-title"><Package size={18} /> Món Nước Đã Đặt</h2>
            <div className="order-items-list">
              {order.items?.map(item => (
                <div key={item.id} className="order-item-row">
                  <div className="item-img-container">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} />
                    ) : (
                      <div className="item-img-placeholder">🧋</div>
                    )}
                  </div>
                  <div className="item-info">
                    <div className="flex items-center gap-2">
                      <h3 className="item-name">{item.productName}</h3>
                      {item.preparedStatus === 'READY' ? (
                        <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                          ✓ Đã pha xong
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                          ⏳ Đang chế biến
                        </span>
                      )}
                    </div>
                    {item.notes && <span className="item-notes">📝 {item.notes}</span>}
                    <p className="item-price-quantity">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>

                  <div className="item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="detail-sidebar">
          <div className="detail-section glass-card">
            <h2 className="section-title"><Clock size={18} /> Thanh Toán</h2>
            <div className="summary-row">
              <span>Tiền nước</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span className="text-emerald-700 font-bold">Freeship</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Tổng thanh toán</span>
              <span className="total-amount">{formatPrice(order.totalPrice)}</span>
            </div>

            {order.orderStatus === 'NEW' && (
              <button
                className="btn-danger-outline w-full mt-4"
                onClick={handleCancelOrder}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Đang hủy...' : 'Hủy đơn hàng này'}
              </button>
            )}
          </div>

          <div className="detail-section glass-card">
            <h2 className="section-title"><MapPin size={18} /> Nhận Món</h2>
            <p className="address-text">{order.shippingAddress || 'Nhận tại quầy Túc Tắc Tea'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

