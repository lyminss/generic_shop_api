import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { orderService, recipeService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import { testNotificationSound } from '../../utils/audio';
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
  Search,
  BookOpen,
  Sparkles,
  Zap,
  CupSoda,
  CheckCheck,
  X,
  Layers,
  CheckCircle,
  Volume2
} from 'lucide-react';
import './BaristaKDS.css';

const getTabFromPath = (pathname) => {
  if (pathname.includes('history')) return 'history';
  return 'active';
};

const BaristaKDS = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [subFilter, setSubFilter] = useState('ALL'); // 'ALL' | 'PROCESSING' | 'SHIPPING'
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingItem, setMarkingItem] = useState(null); // itemId being marked
  const [markingAllOrder, setMarkingAllOrder] = useState(null); // orderId being batch marked
  const [currentTime, setCurrentTime] = useState(Date.now());
  const toast = useToast();
  const [error, setError] = useState(false);

  // Recipe Modal State
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Live timer tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    const interval = setInterval(fetchOrders, 3500);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Barista marks 1 item as READY
  const handleMarkItemReady = async (itemId, orderId) => {
    const parentOrder = orders.find((o) => o.id === orderId);
    if (parentOrder && parentOrder.paymentMethod === 'QR_TRANSFER' && parentOrder.paymentStatus !== 'PAID') {
      toast.error(`⚠️ Đơn #${orderId} chưa được Thu ngân xác nhận tiền QR! Vui lòng chờ tiền vào tài khoản.`);
      return;
    }

    setMarkingItem(itemId);
    try {
      const res = await orderService.markItemReady(itemId);
      if (res.data?.allReady) {
        toast.success(`🎉 Tất cả ly đơn #${orderId} đã pha xong! Đã chuyển sang Chờ Trả Quầy.`);
      } else {
        toast.success('✅ Đã đánh dấu ly pha xong (đã tự trừ kho nguyên liệu)!');
      }
      fetchOrders();
    } catch (err) {
      toast.error(typeof err.response?.data === 'string' ? err.response.data : 'Không thể cập nhật trạng thái món');
    } finally {
      setMarkingItem(null);
    }
  };

  // Barista marks ALL items in a ticket as READY in 1 click
  const handleMarkAllReady = async (order) => {
    if (order && order.paymentMethod === 'QR_TRANSFER' && order.paymentStatus !== 'PAID') {
      toast.error(`⚠️ Đơn #${order.id} chưa được Thu ngân xác nhận tiền QR! Vui lòng chờ tiền vào tài khoản.`);
      return;
    }

    const pendingItems = order.items?.filter(i => i.preparedStatus !== 'READY') || [];
    if (pendingItems.length === 0) return;

    setMarkingAllOrder(order.id);
    try {
      for (const item of pendingItems) {
        await orderService.markItemReady(item.id);
      }
      toast.success(`🎉 Đã pha xong tất cả ${pendingItems.length} món đơn #${order.id} → Chờ Trả Quầy!`);
      fetchOrders();
    } catch {
      toast.error('Có lỗi khi đánh dấu hoàn tất các món');
    } finally {
      setMarkingAllOrder(null);
    }
  };

  // Barista completes order handover (Trả khách)
  const handleCompleteOrder = async (orderId) => {
    try {
      await orderService.updateOrderStatus(orderId, 'COMPLETED');
      toast.success(`🎉 Đã hoàn tất trả đơn #${orderId} cho khách!`);
      fetchOrders();
    } catch (err) {
      toast.error(typeof err.response?.data === 'string' ? err.response.data : 'Không thể hoàn tất đơn hàng');
    }
  };

  // Open recipe inspector
  const handleOpenRecipe = async (productId, productName) => {
    setRecipeModalOpen(true);
    setLoadingRecipe(true);
    setSelectedRecipe({ productName, items: [], maxServingsAvailable: null });
    try {
      const res = await recipeService.getRecipeByProductId(productId);
      setSelectedRecipe({
        productName: res.data?.productName || productName,
        items: res.data?.recipeItems || [],
        maxServingsAvailable: res.data?.maxServingsAvailable
      });
    } catch {
      toast.error('Chưa có công thức định lượng cho món này');
      setRecipeModalOpen(false);
    } finally {
      setLoadingRecipe(false);
    }
  };

  // Sort and filter orders
  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => (a.id || 0) - (b.id || 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
  }, [orders]);

  const activeOrders = useMemo(() => {
    return sortedOrders.filter(
      (o) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'SHIPPING'
    );
  }, [sortedOrders]);

  const completedHistory = useMemo(() => {
    return sortedOrders.filter((o) => o.orderStatus === 'COMPLETED');
  }, [sortedOrders]);

  // Filtered active list
  const filteredActiveOrders = useMemo(() => {
    return activeOrders.filter((ord) => {
      // Sub tab filter
      if (subFilter === 'PROCESSING' && ord.orderStatus !== 'PROCESSING') return false;
      if (subFilter === 'SHIPPING' && ord.orderStatus !== 'SHIPPING') return false;

      // Search query filter
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const matchId = ord.id?.toString().includes(q);
        const matchAddress = ord.shippingAddress?.toLowerCase().includes(q);
        const matchItems = ord.items?.some(i => i.productName?.toLowerCase().includes(q));
        return matchId || matchAddress || matchItems;
      }
      return true;
    });
  }, [activeOrders, subFilter, search]);

  // Shift performance metrics
  const processingCount = activeOrders.filter(o => o.orderStatus === 'PROCESSING').length;
  const shippingCount = activeOrders.filter(o => o.orderStatus === 'SHIPPING').length;
  const pendingDrinksCount = activeOrders.reduce((sum, ord) => {
    return sum + (ord.items?.filter(i => i.preparedStatus !== 'READY').reduce((s, i) => s + (i.quantity || 1), 0) || 0);
  }, 0);
  const completedDrinksCount = completedHistory.reduce((sum, ord) => {
    return sum + (ord.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0);
  }, 0);

  // Format MM:SS elapsed time
  const getElapsedFormatted = (dateStr) => {
    if (!dateStr) return '00:00';
    const diffMs = Math.max(0, currentTime - new Date(dateStr).getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedMinutes = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((currentTime - new Date(dateStr).getTime()) / 60000);
  };

  return (
    <div className="kds-container animate-fade-in">
      {/* Shift Overview Metrics */}
      <div className="kds-metrics-bar">
        <div className="metric-card metric-primary">
          <div className="metric-icon-box">
            <CupSoda size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Ly Đang Chờ Pha</span>
            <strong className="metric-value">{pendingDrinksCount} ly <small>({processingCount} vé)</small></strong>
          </div>
        </div>

        <div className="metric-card metric-warning">
          <div className="metric-icon-box">
            <Sparkles size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Chờ Trả Quầy</span>
            <strong className="metric-value">{shippingCount} vé</strong>
          </div>
        </div>

        <div className="metric-card metric-success">
          <div className="metric-icon-box">
            <CheckCheck size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Đã Pha Trong Ca</span>
            <strong className="metric-value">{completedDrinksCount} ly <small>({completedHistory.length} đơn)</small></strong>
          </div>
        </div>

        <div className="metric-card metric-info">
          <div className="metric-icon-box">
            <Clock size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Tốc Độ Trung Bình</span>
            <strong className="metric-value">~ 3.5 phút / ly</strong>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="kds-header">
        <div className="flex items-center gap-3">
          <div className="kds-icon-badge">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="kds-title">🧋 Màn Hình Pha Chế Quầy Bar (KDS)</h1>
            <p className="kds-subtitle">
              Pha từng món hoặc hoàn tất cả vé — Đơn tự động chuyển sang Chờ Trả Khách
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              testNotificationSound('barista');
              toast.info('🔔 Đang phát thử chuông Barista!');
            }}
            className="kds-refresh-btn"
            style={{ borderColor: '#ea580c', color: '#ea580c' }}
            title="Bấm để kiểm tra âm thanh chuông báo"
          >
            <Volume2 size={16} />
            Thử chuông
          </button>
          <button onClick={fetchOrders} className="kds-refresh-btn" title="Cập nhật danh sách">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới ({activeOrders.length} vé)
          </button>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="kds-nav-row">
        <div className="kds-tabs">
          <button
            className={`kds-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <ChefHat size={18} /> Bảng Kẹp Đơn ({activeOrders.length})
          </button>
          <button
            className={`kds-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} /> Lịch Sử Hoàn Thành ({completedHistory.length})
          </button>
        </div>

        {activeTab === 'active' && (
          <div className="kds-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã vé, món, bàn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="kds-search-input"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub Filter Pills for Active Tickets */}
      {activeTab === 'active' && (
        <div className="kds-subfilter-row">
          <button
            className={`subfilter-pill ${subFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSubFilter('ALL')}
          >
            Tất cả ({activeOrders.length})
          </button>
          <button
            className={`subfilter-pill ${subFilter === 'PROCESSING' ? 'active' : ''}`}
            onClick={() => setSubFilter('PROCESSING')}
          >
            🔥 Cần pha ({processingCount})
          </button>
          <button
            className={`subfilter-pill ${subFilter === 'SHIPPING' ? 'active' : ''}`}
            onClick={() => setSubFilter('SHIPPING')}
          >
            🛵 Chờ trả khách ({shippingCount})
          </button>
        </div>
      )}

      {/* ================= TAB 1: KDS TICKET GRID ================= */}
      {activeTab === 'active' && (
        <div className="kds-board animate-fade-in">
          {loading ? (
            <CardSkeleton count={3} />
          ) : error ? (
            <ErrorState
              title="Không thể tải danh sách vé pha chế"
              message="Đã xảy ra lỗi khi tải dữ liệu từ máy chủ. Vui lòng thử lại."
              onRetry={fetchOrders}
            />
          ) : filteredActiveOrders.length === 0 ? (
            <EmptyState
              title="Quầy Barista Đã Sạch Sẽ!"
              description="Hiện tại không có ly nước nào cần pha chế. Bạn có thể kiểm tra kho nguyên liệu hoặc chuẩn bị sẵn sàng cho đợt khách tiếp theo ☕"
              icon={CheckCircle2}
              actionText="Làm mới bảng KDS"
              onAction={fetchOrders}
            />
          ) : (
            <div className="kds-tickets-grid">
              {filteredActiveOrders.map((ord) => {
                const elapsedMins = getElapsedMinutes(ord.createdAt);
                const elapsedFormatted = getElapsedFormatted(ord.createdAt);
                const isUrgent = elapsedMins >= 10;
                const isWarning = elapsedMins >= 5 && elapsedMins < 10;
                const isShipping = ord.orderStatus === 'SHIPPING';
                const allItemsReady = ord.items?.every((i) => i.preparedStatus === 'READY');
                const readyCount = ord.items?.filter((i) => i.preparedStatus === 'READY').reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
                const totalCount = ord.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
                const progressPct = totalCount > 0 ? (readyCount / totalCount) * 100 : 0;
                const isMarkingAll = markingAllOrder === ord.id;

                return (
                  <div
                    key={ord.id}
                    className={`kds-ticket ${isShipping ? 'ticket-ready' : isUrgent ? 'ticket-urgent' : isWarning ? 'ticket-warning' : ''}`}
                  >
                    {/* Ticket Header */}
                    <div className="ticket-header">
                      <div>
                        <span className="ticket-id">VÉ #{ord.id}</span>
                        <span className="ticket-time">
                          {new Date(ord.createdAt).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>

                      {/* Live Ticker Clock Badge */}
                      <div className={`elapsed-tag ${isUrgent ? 'urgent' : isWarning ? 'warning' : 'normal'}`}>
                        {isUrgent ? <AlertTriangle size={13} /> : <Clock size={13} />}
                        <span>{elapsedFormatted}</span>
                      </div>
                    </div>

                    {/* Customer & Location info */}
                    <div className="ticket-info-card">
                      <span className="ticket-address-text truncate">
                        📍 {ord.shippingAddress || 'Khách tại quầy POS'}
                      </span>
                    </div>

                    {/* Unpaid QR Transfer Warning Banner */}
                    {ord.paymentMethod === 'QR_TRANSFER' && ord.paymentStatus !== 'PAID' && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.18)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#f87171',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginBottom: '0.65rem'
                      }}>
                        <AlertTriangle size={15} /> Chờ thu ngân xác nhận tiền QR (Chưa pha)
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="ticket-progress-container">
                      <div className="ticket-progress-bar-bg">
                        <div
                          className="ticket-progress-bar-fill"
                          style={{
                            width: `${progressPct}%`,
                            background: allItemsReady ? '#10b981' : isUrgent ? '#ef4444' : '#f59e0b',
                          }}
                        />
                      </div>
                      <span className="ticket-progress-text">
                        {readyCount}/{totalCount} ly ({Math.round(progressPct)}%)
                      </span>
                    </div>

                    {/* Drink & Item List */}
                    <div className="ticket-items">
                      {ord.items?.map((item) => {
                        const isDone = item.preparedStatus === 'READY';
                        const isMarkingThis = markingItem === item.id;

                        return (
                          <div
                            key={item.id}
                            className={`ticket-item-row ${isDone ? 'item-done' : ''}`}
                          >
                            <div className="item-left">
                              <div className="qty-box">{item.quantity}×</div>
                              <div className="item-name-group">
                                <span className="item-name">{item.productName}</span>
                                {item.options && (
                                  <span className="badge-item-options" style={{
                                    display: 'inline-block',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: '#b45309',
                                    background: '#fef3c7',
                                    border: '1px solid #fde68a',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    marginTop: '2px',
                                    lineHeight: 1.3
                                  }}>
                                    ✨ {item.options}
                                  </span>
                                )}
                                {isDone ? (
                                  <span className="badge-item-done">✓ Đã pha</span>
                                ) : (
                                  <span className="badge-item-pending">⏳ Chờ pha</span>
                                )}
                              </div>
                            </div>

                            <div className="item-right-actions">
                              {/* Recipe Inspector Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenRecipe(item.product?.id || item.productId, item.productName)}
                                className="btn-item-recipe"
                                title="Xem công thức định lượng"
                              >
                                <BookOpen size={13} /> Công thức
                              </button>

                              {/* Single item finish button */}
                              {!isDone && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkItemReady(item.id, ord.id)}
                                  disabled={isMarkingThis || isMarkingAll}
                                  className="btn-mark-ready"
                                >
                                  {isMarkingThis ? '...' : <><Check size={13} /> Xong</>}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ticket Footer Actions */}
                    <div className="ticket-footer">
                      {isShipping && allItemsReady ? (
                        <button
                          onClick={() => handleCompleteOrder(ord.id)}
                          className="kds-btn-complete animate-pulse-slight"
                        >
                          <Check size={18} />
                          ✓ Đã Trả Khách (Hoàn Tất Đơn)
                        </button>
                      ) : (
                        <div className="ticket-actions-group">
                          <button
                            onClick={() => handleMarkAllReady(ord)}
                            disabled={isMarkingAll || allItemsReady}
                            className="kds-btn-done-all"
                          >
                            <Zap size={15} />
                            {isMarkingAll ? 'Đang hoàn tất...' : '⚡ Pha Xong Cả Vé'}
                          </button>

                          <div className="ticket-pending-hint">
                            <Flame size={14} className="text-amber-400 inline mr-1" />
                            Còn <strong>{totalCount - readyCount}</strong> ly chưa pha
                          </div>
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
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={22} />
                Lịch Sử Các Đơn Đã Pha Xong & Trả Khách Trong Ca
              </h3>
              <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800">
                Tổng: {completedHistory.length} đơn · {completedDrinksCount} ly
              </span>
            </div>

            {completedHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Coffee size={40} className="mx-auto mb-3 text-gray-500 opacity-60" />
                <p className="font-semibold">Chưa có đơn hàng nào hoàn thành trong ca làm việc này.</p>
                <span className="text-xs text-gray-500">Các đơn khi hoàn tất trả khách sẽ lưu vào đây.</span>
              </div>
            ) : (
              <div className="history-grid">
                {completedHistory.map((ord) => (
                  <div key={ord.id} className="history-card">
                    <div className="history-card-header">
                      <div>
                        <span className="history-ticket-id">VÉ #{ord.id}</span>
                        <span className="history-time">
                          {new Date(ord.updatedAt || ord.createdAt).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                      <span className="history-badge-done">✓ Đã Hoàn Thành</span>
                    </div>

                    <div className="history-card-body">
                      <p className="history-address">📍 {ord.shippingAddress || 'Khách tại quầy POS'}</p>
                      <div className="history-items-list">
                        {ord.items?.map((item) => (
                          <div key={item.id} className="history-item-row">
                            <div>
                              <span>{item.quantity}× {item.productName}</span>
                              {item.options && (
                                <div className="text-xs text-amber-500 font-medium">✨ {item.options}</div>
                              )}
                            </div>
                            <span className="text-emerald-400 text-xs font-semibold">✓ Đã pha</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="history-card-footer">
                      <span className="text-xs text-gray-400">Tổng thu tiền:</span>
                      <strong className="text-emerald-400 font-bold">{formatPrice(ord.totalPrice)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: XEM CÔNG THỨC MÓN ================= */}
      {recipeModalOpen && createPortal(
        <div className="kds-recipe-modal-overlay" onClick={() => setRecipeModalOpen(false)}>
          <div className="kds-recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kds-recipe-header">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-400" />
                <h3 className="text-base font-bold text-gray-100">
                  Công Thức: {selectedRecipe?.productName}
                </h3>
              </div>
              <button
                className="kds-recipe-close"
                onClick={() => setRecipeModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="kds-recipe-body">
              {loadingRecipe ? (
                <div className="py-8 text-center text-gray-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-400" />
                  Đang tải công thức định lượng...
                </div>
              ) : selectedRecipe?.items?.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  Chưa có thông tin định lượng nguyên liệu cho món này.
                </div>
              ) : (
                <>
                  <div className="recipe-meta-box">
                    <span>Khả năng phục vụ với kho hiện tại:</span>
                    <strong className="text-emerald-400 text-base">
                      {selectedRecipe?.maxServingsAvailable !== null ? `${selectedRecipe.maxServingsAvailable} ly` : 'Đủ tồn kho'}
                    </strong>
                  </div>

                  <table className="kds-recipe-table">
                    <thead>
                      <tr>
                        <th>Nguyên liệu</th>
                        <th>Định lượng / Ly</th>
                        <th>Tồn kho hiện tại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecipe?.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="font-semibold text-gray-200">{item.ingredientName}</td>
                          <td className="font-bold text-amber-400">{item.quantity} {item.unit}</td>
                          <td className="text-gray-400 text-xs">
                            {item.currentIngredientStock} {item.ingredientUnit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="kds-recipe-footer">
              <button
                type="button"
                className="kds-recipe-btn-close"
                onClick={() => setRecipeModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BaristaKDS;
