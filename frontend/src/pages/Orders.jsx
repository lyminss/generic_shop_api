import { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { Package } from 'lucide-react';
import './Orders.css';

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
    return <div className="loading-state">Loading your orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="orders-empty animate-fade-in">
        <Package size={64} className="empty-icon" />
        <h2>No orders yet</h2>
        <p>When you place an order, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="orders-container animate-fade-in">
      <h1 className="page-title">Order History</h1>
      
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card glass-panel">
            <div className="order-header">
              <div>
                <span className="order-id">Order #{order.id}</span>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={`order-status status-${order.orderStatus?.toLowerCase()}`}>
                {order.orderStatus}
              </div>
            </div>
            
            <div className="order-body">
              <p><strong>Total Amount:</strong> ${order.totalPrice?.toFixed(2)}</p>
              <p><strong>Shipping Address:</strong> {order.shippingAddress}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
