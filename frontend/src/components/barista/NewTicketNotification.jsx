import React from 'react';
import { BellRing, Coffee, Flame, X, ArrowRight, Zap, Check } from 'lucide-react';
import './NewTicketNotification.css';

const NewTicketNotification = ({
  newTickets = [],
  onScrollToTicket,
  onDismiss
}) => {
  if (!newTickets || newTickets.length === 0) return null;

  return (
    <div className="new-ticket-toast-container">
      {newTickets.map((order) => {
        const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        const itemsSummary = order.items?.map(i => `${i.quantity}x ${i.productName || i.product?.name}`).join(', ') || 'Chi tiết đồ uống';

        return (
          <div key={order.id} className="new-ticket-card animate-slide-in">
            {/* Header */}
            <div className="new-ticket-header">
              <div className="new-ticket-title-group">
                <div className="new-ticket-bell-wrapper">
                  <Flame size={20} className="ticket-flame-icon" />
                  <span className="ticket-pulse-ring"></span>
                </div>
                <div>
                  <div className="new-ticket-heading">
                    <span>VÉ PHA CHẾ MỚI #{order.id}</span>
                    <span className="new-ticket-badge-live">CẦN PHA</span>
                  </div>
                  <span className="new-ticket-time">
                    {new Date(order.createdAt || Date.now()).toLocaleTimeString('vi-VN')} · Thu ngân vừa chuyển
                  </span>
                </div>
              </div>
              <button
                className="new-ticket-close-btn"
                onClick={() => onDismiss(order.id)}
                title="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="new-ticket-body">
              <div className="new-ticket-dest">
                <span className="dest-tag">Bàn / Nơi nhận:</span>
                <strong className="dest-val">{order.shippingAddress || 'Khách tại quầy POS'}</strong>
              </div>

              <div className="new-ticket-items">
                <Coffee size={15} className="flex-shrink-0 text-orange-500" />
                <span className="new-ticket-items-text" title={itemsSummary}>
                  <strong>{itemCount} ly đồ uống:</strong> {itemsSummary}
                </span>
              </div>
            </div>

            {/* Quick Action */}
            <div className="new-ticket-actions">
              <button
                className="btn-ticket-ack"
                onClick={() => {
                  onDismiss(order.id);
                  if (onScrollToTicket) onScrollToTicket(order.id);
                }}
              >
                <Zap size={15} /> Nhận pha ngay <ArrowRight size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NewTicketNotification;
