import React from 'react';
import { BellRing, Check, ArrowRight, X, Sparkles, MapPin, Coffee } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import './NewOrderNotification.css';

const NewOrderNotification = ({
  newOrders = [],
  onConfirm,
  onViewOrder,
  onDismiss
}) => {
  if (!newOrders || newOrders.length === 0) return null;

  return (
    <div className="new-order-toast-container">
      {newOrders.map((order) => {
        const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        const itemsSummary = order.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ') || 'Chi tiết đơn hàng';

        return (
          <div key={order.id} className="new-order-card animate-slide-in">
            {/* Header with glowing badge */}
            <div className="new-order-header">
              <div className="new-order-title-group">
                <div className="new-order-bell-wrapper">
                  <BellRing size={20} className="bell-ringing-icon" />
                  <span className="bell-pulse-ring"></span>
                </div>
                <div>
                  <div className="new-order-heading">
                    <span>ĐƠN HÀNG MỚI #{order.id}</span>
                    <span className="new-order-badge-live">MỚI</span>
                  </div>
                  <span className="new-order-time">
                    {new Date(order.createdAt || Date.now()).toLocaleTimeString('vi-VN')} · Vừa đặt
                  </span>
                </div>
              </div>
              <button
                className="new-order-close-btn"
                onClick={() => onDismiss(order.id)}
                title="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content summary */}
            <div className="new-order-body">
              <div className="new-order-address">
                <MapPin size={14} className="flex-shrink-0 text-emerald-600" />
                <span className="truncate">{order.shippingAddress || 'Khách tại quầy POS'}</span>
              </div>

              <div className="new-order-items-preview">
                <Coffee size={14} className="flex-shrink-0 text-amber-600" />
                <span className="new-order-items-text" title={itemsSummary}>
                  <strong>{itemCount} ly/món:</strong> {itemsSummary}
                </span>
              </div>

              <div className="new-order-price-row">
                <span className="price-label">Tổng tiền:</span>
                <span className="price-value">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="new-order-actions">
              <button
                className="btn-order-view"
                onClick={() => onViewOrder(order.id)}
              >
                Xem chi tiết <ArrowRight size={14} />
              </button>
              <button
                className="btn-order-confirm"
                onClick={() => onConfirm(order.id)}
              >
                <Check size={16} /> Xác nhận → Barista
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NewOrderNotification;
