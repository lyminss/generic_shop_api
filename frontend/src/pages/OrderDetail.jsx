import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import { ArrowLeft, Clock, MapPin, AlertCircle, ShoppingBag, Package } from 'lucide-react';
import './OrderDetail.css';

const STATUS_CONFIG = {
  NEW: { label: 'Đơn mới', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  PROCESSING: { label: 'Đang chuẩn bị', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  SHIPPING: { label: 'Đang giao hàng', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  CANCEL: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
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
    return <div className="loading-state">Đang tải thông tin chi tiết đơn hàng...</div>;
  }

  if (!order) {
    return (
      <div className="order-not-found animate-fade-in">
        <AlertCircle size={48} className="error-icon" />
        <h2>Không Tìm Thấy Đơn Hàng</h2>
        <p>Rất tiếc, chúng tôi không tìm thấy đơn hàng này.</p>
        <Link to="/profile?tab=orders" className="btn-secondary">
          <ArrowLeft size={16} /> Quay lại Đơn hàng của tôi
        </Link>
      </div>
    );
  }

  const st = STATUS_CONFIG[order.orderStatus] || { label: order.orderStatus, cls: '' };

  return (
    <div className="order-detail-container animate-fade-in">
      <Link to="/profile?tab=orders" className="back-link">
        <ArrowLeft size={18} /> Quay lại danh sách đơn hàng
      </Link>

      <div className="order-detail-header glass-panel">
        <div className="header-left">
          <h1 className="detail-title">Đơn hàng #{order.id}</h1>
          <p className="detail-date">Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <div className="header-right">
          <span className={`order-status ${st.cls}`}>{st.label}</span>
        </div>
      </div>

      <div className="order-detail-layout">
        <div className="detail-main">
          {/* Order Items */}
          <div className="detail-section glass-panel">
            <h2 className="section-title"><Package size={18} /> Món ăn đã đặt</h2>
            <div className="order-items-list">
              {order.items?.map(item => (
                <div key={item.id} className="order-item-row">
                  <div className="item-img-container">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} />
                    ) : (
                      <div className="item-img-placeholder">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>
                  <div className="item-info">
                    <h3>{item.productName}</h3>
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

        <div className="detail-sidebar">
          {/* Summary */}
          <div className="detail-section glass-panel">
            <h2 className="section-title"><Clock size={18} /> Tóm tắt thanh toán</h2>
            <div className="summary-row">
              <span>Tiền món ăn</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            <div className="summary-row">
              <span>Phí giao hàng</span>
              <span style={{ color: 'var(--success-color)' }}>Miễn phí</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Tổng thanh toán</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>

            {order.orderStatus === 'NEW' && (
              <button
                className="btn-danger cancel-order-btn"
                onClick={handleCancelOrder}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
            )}
          </div>

          {/* Delivery */}
          <div className="detail-section glass-panel">
            <h2 className="section-title"><MapPin size={18} /> Thông tin nhận món</h2>
            <div className="delivery-address">
              <p className="address-text">{order.shippingAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
