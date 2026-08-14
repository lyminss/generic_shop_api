import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import {
  Coffee,
  CheckCircle2,
  Clock,
  RefreshCw,
  Flame,
  Check,
  AlertTriangle,
  History,
  ChefHat,
} from 'lucide-react';
import './BaristaKDS.css';

const getTabFromPath = (pathname) =>
  pathname.includes('history') ? 'history' : 'kds';

const BaristaKDS = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Sync tab with URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getAllOrders();
      setOrders(res.data || []);
    } catch {
      console.error('Failed to fetch orders for KDS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // Refresh KDS screen every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update Status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'SHIPPING') {
        toast.success(`Đơn #${orderId} đã pha chế xong! Chuyển sang Giao hàng.`);
      } else if (newStatus === 'COMPLETED') {
        toast.success(`Đã hoàn tất trả đơn #${orderId}! 🎉`);
      }
      fetchOrders();
    } catch {
      toast.error('Không thể cập nhật trạng thái đơn');
    }
  };

  // Filter orders for KDS display
  // Orders waiting for Barista: PROCESSING (needs prep), SHIPPING (prep done, awaiting delivery)
  const processingOrders = orders.filter(
    (o) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'SHIPPING'
  );
  const completedHistory = orders.filter((o) => o.orderStatus === 'COMPLETED');

  // Time elapsed calculator in minutes
  const getElapsedMinutes = (dateStr) => {
    if (!dateStr) return 0;
    const diffMs = new Date() - new Date(dateStr);
    return Math.floor(diffMs / 60000);
  };

  return (
    <div className="kds-container animate-fade-in">
      {/* Barista Header */}
      <div className="kds-header">
        <div className="flex items-center gap-3">
          <div className="kds-icon-badge">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="kds-title">🧋 Bảng Pha Chế Quầy Bar (Barista KDS)</h1>
            <p className="kds-subtitle">
              Màn hình cảm ứng hiển thị danh sách đơn chế biến real-time cho Barista
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="kds-refresh-btn">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Cập nhật ({processingOrders.length} đơn chờ)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="kds-tabs">
        <button
          className={`kds-tab-btn ${activeTab === 'kds' ? 'active' : ''}`}
          onClick={() => setActiveTab('kds')}
        >
          <ChefHat size={18} /> Bảng Kẹp Đơn Pha Chế ({processingOrders.length})
        </button>
        <button
          className={`kds-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> Lịch Sử Hoàn Thành Ca ({completedHistory.length})
        </button>
      </div>

      {/* ================= TAB 1: BẢNG KẸP ĐƠN PHA CHẾ (KDS) ================= */}
      {activeTab === 'kds' && (
        <div className="kds-board animate-fade-in">
          {processingOrders.length === 0 ? (
            <div className="kds-empty-state">
              <CheckCircle2 size={64} className="text-emerald-400 mb-3" />
              <h2>Hiện không có ly trà nào cần pha!</h2>
              <p>Thư giãn một chút hoặc kiểm tra nguyên liệu chuẩn bị cho ca tiếp theo nhé ☕</p>
            </div>
          ) : (
            <div className="kds-tickets-grid">
              {processingOrders.map((ord) => {
                const elapsed = getElapsedMinutes(ord.createdAt);
                const isUrgent = elapsed >= 10;
                const isShipping = ord.orderStatus === 'SHIPPING';

                return (
                  <div
                    key={ord.id}
                    className={`kds-ticket ${isShipping ? 'ticket-ready' : isUrgent ? 'ticket-urgent' : ''}`}
                  >
                    {/* Ticket Header */}
                    <div className="ticket-header">
                      <div>
                        <span className="ticket-id">ĐƠN #{ord.id}</span>
                        <span className="ticket-time font-mono">
                          <Clock size={13} className="inline mr-1" />
                          {new Date(ord.createdAt).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                      <div className={`elapsed-tag ${isUrgent ? 'urgent' : ''}`}>
                        {isUrgent && <AlertTriangle size={13} />}
                        {elapsed} phút
                      </div>
                    </div>

                    {/* Customer info */}
                    <div className="ticket-info">
                      <span className="truncate">{ord.shippingAddress || 'Khách tại quầy'}</span>
                    </div>

                    {/* Drink & Item List */}
                    <div className="ticket-items">
                      {ord.items?.map((item, idx) => (
                        <div key={idx} className="ticket-item-row">
                          <div className="qty-box">{item.quantity}×</div>
                          <div className="item-name">
                            <span>{item.productName}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions footer */}
                    <div className="ticket-footer">
                      {!isShipping ? (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'SHIPPING')}
                          className="kds-btn-done"
                        >
                          <Flame size={18} />
                          Pha Xong &rarr; Báo Giao hàng
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                          className="kds-btn-complete"
                        >
                          <Check size={18} />
                          ✓ Trả Món Hoàn Thành
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: LỊCH SỬ CA ================= */}
      {activeTab === 'history' && (
        <div className="kds-board animate-fade-in">
          <div className="kds-history-box">
            <h3 className="text-lg font-bold text-gray-200 mb-4">
              ✅ Các đơn đã hoàn thành trong ca
            </h3>
            <div className="space-y-3">
              {completedHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Chưa có đơn nào hoàn thành trong ca này.</p>
              ) : (
                completedHistory.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl border border-gray-700">
                    <div>
                      <span className="font-bold text-amber-400">Đơn #{ord.id}</span>
                      <span className="text-xs text-gray-400 ml-3">
                        {new Date(ord.updatedAt || ord.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                      <p className="text-xs text-gray-300 mt-1">
                        {ord.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-400 text-sm">{formatPrice(ord.totalPrice)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaristaKDS;
