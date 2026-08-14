import { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';
import './Orders.css';

const STATUS_CONFIG = {
  NEW:        { label: 'Đơn mới',       cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  PROCESSING: { label: 'Đang chuẩn bị', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  SHIPPING:   { label: 'Đang giao hàng',  cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  COMPLETED:  { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  CANCEL:     { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="orders-container animate-fade-in">
        <h1 className="page-title">Đơn hàng của tôi</h1>
        <div className="orders-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="order-skeleton glass-panel">
              <div className="skeleton-line skeleton-shimmer" style={{ width: '30%', height: '1.1rem' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '20%', height: '0.8rem', marginTop: '0.5rem' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-empty animate-fade-in" style={{ minHeight: '30vh', padding: '2rem 0' }}>
        <Package size={48} className="empty-icon" />
        <h2>Chưa có đơn hàng nào</h2>
        <p>Món ăn ngon bạn đặt sẽ xuất hiện ở đây.</p>
        <Link to="/" className="btn-primary" style={{ marginTop: '1.25rem', display: 'inline-block' }}>
          <ShoppingBag size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Xem thực đơn ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-container animate-fade-in">
      <h1 className="page-title">Lịch sử đặt món</h1>
      <p className="page-subtitle">Đã đặt {orders.length} đơn hàng</p>

      <div className="orders-list">
        {orders.map(order => {
          const st = STATUS_CONFIG[order.orderStatus] || { label: order.orderStatus, cls: '' };
          const previewItems = (order.items || []).slice(0, 3);
          return (
            <Link key={order.id} to={`/orders/${order.id}`} className="order-card glass-panel">
              <div className="order-header">
                <div className="order-meta">
                  <span className="order-id">Đơn hàng #{order.id}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className="order-right">
                  <div className={`order-status ${st.cls}`}>{st.label}</div>
                  <ChevronRight size={18} className="order-chevron" />
                </div>
              </div>

              {/* Item previews */}
              {previewItems.length > 0 && (
                <div className="order-items-preview">
                  {previewItems.map(item => (
                    <div key={item.id} className="preview-item">
                      {item.productImage
                        ? <img src={item.productImage} alt={item.productName} className="preview-img" />
                        : <div className="preview-img preview-img-placeholder"><Package size={16} /></div>
                      }
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div className="preview-more">+{order.items.length - 3}</div>
                  )}
                </div>
              )}

              <div className="order-footer">
                <span className="order-items-count">
                  {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} phần ăn
                </span>
                <span className="order-total">{formatPrice(order.totalPrice)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
