import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatTimeAgo } from '../../utils/format';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/common/StateViews';
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
  Sparkles,
} from 'lucide-react';
import './BaristaKDS.css';


const getTabFromPath = (pathname) =>
  pathname.includes('history') ? 'history' : 'kds';

const BaristaKDS = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingItem, setMarkingItem] = useState(null); // itemId being marked
  const toast = useToast();

  const [error, setError] = useState(false);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getAllOrders();
      setOrders(res.data || []);
      setError(false);
    } catch {
      console.error('Failed to fetch orders for KDS');
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Barista đánh dấu 1 món đã pha xong
  const handleMarkItemReady = async (itemId, orderId) => {
    setMarkingItem(itemId);
    try {
      const res = await orderService.markItemReady(itemId);
      if (res.data.allReady) {
        toast.success(`🎉 Tất cả món đơn #${orderId} đã pha xong! Chuyển sang Chờ Trả Quầy.`);
      } else {
        toast.success('✅ Đã đánh dấu món pha xong!');
      }
      fetchOrders();
    } catch {
      toast.error('Không thể cập nhật trạng thái món');
    } finally {
      setMarkingItem(null);
    }
  };

  // Barista hoàn tất trả khách (chỉ khi tất cả món = READY)
  const handleCompleteOrder = async (orderId) => {
    try {
      await orderService.updateOrderStatus(orderId, 'COMPLETED');
      toast.success(`🎉 Đã hoàn tất trả đơn #${orderId}!`);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data || 'Không thể hoàn tất đơn hàng');
    }
  };

  const processingOrders = orders.filter(
    (o) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'SHIPPING'
  );
  const completedHistory = orders.filter((o) => o.orderStatus === 'COMPLETED');

  const getElapsedMinutes = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((new Date() - new Date(dateStr)) / 60000);
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
            <h1 className="kds-title">🧋 Màn Hình Quầy Bar (Barista KDS)</h1>
            <p className="kds-subtitle">
              Đánh dấu từng món pha xong — đơn tự chuyển sang Trả Quầy khi hết vé
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="kds-refresh-btn">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Cập nhật ({processingOrders.length} vé)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="kds-tabs">
        <button
          className={`kds-tab-btn ${activeTab === 'kds' ? 'active' : ''}`}
          onClick={() => setActiveTab('kds')}
        >
          <ChefHat size={18} /> Bảng Pha Chế ({processingOrders.length})
        </button>
        <button
          className={`kds-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> Lịch Sử Hoàn Thành ({completedHistory.length})
        </button>
      </div>

      {/* ================= TAB 1: KDS TICKET GRID ================= */}
      {activeTab === 'kds' && (
        <div className="kds-board animate-fade-in" style={{ minHeight: '380px' }}>
          {loading ? (
            <CardSkeleton count={3} />
          ) : error ? (
            <ErrorState
              title="Không thể tải danh sách vé pha chế"
              message="Đã xảy ra lỗi khi tải dữ liệu từ máy chủ. Vui lòng thử lại."
              onRetry={fetchOrders}
            />
          ) : processingOrders.length === 0 ? (
            <EmptyState
              title="Quầy Barista Sạch Sẽ!"
              description="Hiện tại không có ly trà nào cần pha chế. Bạn có thể kiểm tra kho nguyên liệu hoặc chuẩn bị cho ca tiếp theo ☕"
              icon={CheckCircle2}
              actionText="Làm mới bảng KDS"
              onAction={fetchOrders}
            />
          ) : (
            <div className="kds-tickets-grid">

              {processingOrders.map((ord) => {
                const elapsed = getElapsedMinutes(ord.createdAt);
                const isUrgent = elapsed >= 10;
                const isShipping = ord.orderStatus === 'SHIPPING';
                const allItemsReady = ord.items?.every(i => i.preparedStatus === 'READY');
                const readyCount = ord.items?.filter(i => i.preparedStatus === 'READY').reduce((acc, i) => acc + i.quantity, 0) || 0;
                const totalCount = ord.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;


                return (
                  <div
                    key={ord.id}
                    className={`kds-ticket ${isShipping ? 'ticket-ready' : isUrgent ? 'ticket-urgent' : ''}`}
                  >
                    {/* Ticket Header */}
                    <div className="ticket-header">
                      <div>
                        <span className="ticket-id">VÉ #{ord.id}</span>
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
                      <span className="truncate">📍 {ord.shippingAddress || 'Khách tại quầy POS'}</span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        flex: 1,
                        height: '6px',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '99px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: totalCount > 0 ? `${(readyCount / totalCount) * 100}%` : '0%',
                          height: '100%',
                          background: allItemsReady ? '#10b981' : '#f59e0b',
                          borderRadius: '99px',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: allItemsReady ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                        {readyCount}/{totalCount}
                      </span>
                    </div>

                    {/* Drink & Item List – each with "Đã Pha" button */}
                    <div className="ticket-items">
                      {ord.items?.map((item) => {
                        const isDone = item.preparedStatus === 'READY';
                        const isMarking = markingItem === item.id;
                        return (
                          <div
                            key={item.id}
                            className="ticket-item-row"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              opacity: isDone ? 0.5 : 1,
                            }}
                          >
                            <div className="qty-box">{item.quantity}×</div>
                            <div className="item-name" style={{
                              flex: 1,
                              fontWeight: isDone ? 400 : 700,
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}>
                              {item.productName}
                            </div>
                            {isDone ? (
                              <span style={{
                                fontSize: '0.72rem',
                                background: '#10b981',
                                color: '#fff',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}>
                                ✓ Xong
                              </span>
                            ) : (
                              <button
                                onClick={() => handleMarkItemReady(item.id, ord.id)}
                                disabled={isMarking}
                                style={{
                                  fontSize: '0.72rem',
                                  background: '#f59e0b',
                                  color: '#1a120b',
                                  border: 'none',
                                  padding: '3px 10px',
                                  borderRadius: '99px',
                                  fontWeight: 700,
                                  cursor: isMarking ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                  opacity: isMarking ? 0.6 : 1,
                                }}
                              >
                                {isMarking ? '...' : 'Đã Pha ✓'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions footer */}
                    <div className="ticket-footer">
                      {isShipping && allItemsReady ? (
                        <button
                          onClick={() => handleCompleteOrder(ord.id)}
                          className="kds-btn-complete"
                        >
                          <Check size={18} />
                          ✓ Đã Trả Khách (Hoàn Thành)
                        </button>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          padding: '10px 0',
                        }}>
                          <Flame size={14} className="inline mr-1 text-amber-400" />
                          {allItemsReady
                            ? 'Tất cả xong — đang chờ xác nhận...'
                            : `Còn ${totalCount - readyCount} món chưa pha`}
                        </div>
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
            <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={20} /> Các đơn đã hoàn tất trong ca
            </h3>
            <div className="space-y-3">
              {completedHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Chưa có đơn nào hoàn thành trong ca làm việc này.</p>
              ) : (
                completedHistory.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl border border-gray-700">
                    <div>
                      <span className="font-bold text-amber-400">Vé #{ord.id}</span>
                      <span className="text-xs text-gray-400 ml-3">
                        {new Date(ord.updatedAt || ord.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                      <p className="text-xs text-gray-300 mt-1">
                        {ord.items?.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
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
