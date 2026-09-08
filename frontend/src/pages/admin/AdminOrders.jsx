import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Receipt,
  Filter,
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  Sparkles,
  User,
  UserCheck,
} from 'lucide-react';
import { formatPrice, formatTimeAgo } from '../../utils/format';
import {
  ORDER_STATUS_CONFIG,
  normalizeOrderStatus,
  getOrderChannel,
  getOrderCustomerInfo,
} from '../../utils/orderHelpers';
import AdminOrderDetailModal from './components/AdminOrderDetailModal';
import './AdminOrders.css';

const STATUS_CFG = ORDER_STATUS_CONFIG;
const normalizeStatus = normalizeOrderStatus;
const getChannel = getOrderChannel;

const PAGE_SIZE = 10;

const AdminOrders = ({ orders = [], loading = false, onUpdateStatus }) => {
  const navigate = useNavigate();

  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Summary Metrics (Tabular nums)
  const summary = useMemo(() => {
    const total = orders.length;
    let pending = 0;
    let processing = 0;
    let shipping = 0;
    let completed = 0;
    let cancelled = 0;

    orders.forEach((o) => {
      const st = normalizeStatus(o.orderStatus);
      if (st === 'NEW') pending++;
      else if (st === 'PROCESSING') processing++;
      else if (st === 'SHIPPING') shipping++;
      else if (st === 'COMPLETED') completed++;
      else if (st === 'CANCEL') cancelled++;
    });

    return { total, pending, processing, shipping, completed, cancelled };
  }, [orders]);

  // Status Tabs Definition
  const statusTabs = [
    { value: '', label: 'Tất cả', count: summary.total },
    { value: 'NEW', label: 'Chờ duyệt', count: summary.pending },
    { value: 'PROCESSING', label: 'Đang pha chế', count: summary.processing },
    { value: 'SHIPPING', label: 'Đang giao', count: summary.shipping },
    { value: 'COMPLETED', label: 'Hoàn thành', count: summary.completed },
    { value: 'CANCEL', label: 'Đã hủy', count: summary.cancelled },
  ];

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) => (b.id ?? 0) - (a.id ?? 0) || new Date(b.createdAt) - new Date(a.createdAt)
    );

    return sorted.filter((o) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const idMatch = String(o.id).toLowerCase().includes(q);
        const addrMatch = o.shippingAddress?.toLowerCase().includes(q);
        const custMatch = (o.customerEmail || o.customerName || '').toLowerCase().includes(q);
        const itemMatch = o.items?.some((i) => i.productName?.toLowerCase().includes(q));
        if (!idMatch && !addrMatch && !custMatch && !itemMatch) return false;
      }

      if (statusFilter && normalizeStatus(o.orderStatus) !== statusFilter) {
        return false;
      }

      if (channelFilter) {
        const ch = getChannel(o.shippingAddress);
        if (channelFilter === 'POS' && !ch.isPos) return false;
        if (channelFilter === 'ONLINE' && ch.isPos) return false;
      }

      if (sourceFilter) {
        const ch = getChannel(o.shippingAddress);
        if (sourceFilter === 'STAFF' && !ch.isPos) return false;
        if (sourceFilter === 'CUSTOMER' && ch.isPos) return false;
      }

      if (dateFilter && o.createdAt) {
        const d = new Date(o.createdAt).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }

      return true;
    });
  }, [orders, search, statusFilter, channelFilter, sourceFilter, dateFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters = Boolean(search || statusFilter || channelFilter || sourceFilter || dateFilter);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setChannelFilter('');
    setSourceFilter('');
    setDateFilter('');
    setPage(1);
  };

  const handleStatusTab = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  // Barista Progress Helper
  const computeBaristaProgress = (items = []) => {
    const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const done = items
      .filter((item) => item.preparedStatus === 'READY' || item.preparedStatus === 'COMPLETED')
      .reduce((sum, item) => sum + (item.quantity || 1), 0);

    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = total > 0 && done === total;

    return { done, total, percentage, isComplete, label: `${done}/${total}` };
  };

  const getItemCount = (order) => (order.items ?? []).reduce((t, d) => t + Number(d.quantity ?? 1), 0);

  return (
    <div className="admin-orders-content animate-fade-in">
      {/* ── 1. Hero Banner (Cohesive with AdminDashboard & AdminStats) ── */}
      <section className="admin-hero-banner" aria-labelledby="orders-page-title">
        <div>
          <div className="orders-hero-badge">
            <span className="orders-pulse-dot" aria-hidden="true" />
            <span>Hệ thống thời gian thực</span>
          </div>
          <h1 id="orders-page-title" className="admin-hero-title">
            Quản Lý Đơn Hàng
          </h1>
          <p className="admin-hero-subtitle">
            Giám sát tiến trình pha chế, điều phối đơn hàng và tiếp nhận xử lý toàn hệ thống theo thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="stats-action-btn"
            style={{ background: 'var(--matcha-dark)', color: '#ffffff' }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Tạo Đơn POS</span>
          </button>
        </div>
      </section>

      {/* ── 2. Metric Cards Grid (MinTea stat-tiles with border-l-4) ── */}
      <section className="stats-cards-grid" aria-label="Thống kê trạng thái đơn hàng">
        {/* Card 1: Chờ duyệt */}
        <div className="stat-tile accent-caramel order-stat-card border-l-amber flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="stat-tile-label">Chờ duyệt</p>
            <div className="icon-tile" aria-hidden="true">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value tabular-nums">{summary.pending}</h3>
            <div className="stats-card-caption">Cần tiếp nhận & xác nhận</div>
          </div>
        </div>

        {/* Card 2: Đang pha chế */}
        <div className="stat-tile accent-taro order-stat-card border-l-purple flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="stat-tile-label">Đang pha chế</p>
            <div className="icon-tile" aria-hidden="true">
              <Sparkles size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value tabular-nums">{summary.processing}</h3>
            <div className="stats-card-caption">Barista đang thực hiện</div>
          </div>
        </div>

        {/* Card 3: Đang giao */}
        <div className="stat-tile accent-teal order-stat-card border-l-teal flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="stat-tile-label">Đang giao</p>
            <div className="icon-tile" aria-hidden="true">
              <Truck size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value tabular-nums">{summary.shipping}</h3>
            <div className="stats-card-caption">Đang trên đường giao</div>
          </div>
        </div>

        {/* Card 4: Hoàn thành */}
        <div className="stat-tile accent-matcha order-stat-card border-l-emerald flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="stat-tile-label">Hoàn thành</p>
            <div className="icon-tile" aria-hidden="true">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value tabular-nums">{summary.completed}</h3>
            <div className="stats-card-caption">
              Tỷ lệ: {summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}% thành công
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Status Tabs Navigation Pills ── */}
      <nav className="orders-tabs-nav" aria-label="Phân loại trạng thái đơn hàng">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusTab(tab.value)}
              className={`orders-tab-pill ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
            >
              <span>{tab.label}</span>
              <span className="orders-tab-count">{tab.count}</span>
            </button>
          );
        })}
      </nav>

      {/* ── 4. Search & Filter Bar (Web Interface Guidelines compliant) ── */}
      <div className="orders-filter-box" role="search" aria-label="Tìm kiếm và lọc đơn hàng">
        <div className="orders-filter-header">
          <div className="flex items-center gap-1.5 font-bold">
            <Filter size={14} className="text-[#7c5c9c]" aria-hidden="true" />
            <span>Bộ lọc tìm kiếm</span>
          </div>
          {hasActiveFilters && (
            <span className="text-[11px] font-semibold text-rose-700">
              Đang áp dụng bộ lọc tùy chỉnh
            </span>
          )}
        </div>

        <div className="orders-filter-grid">
          {/* Ô tìm kiếm */}
          <div>
            <label htmlFor="order-search-input" className="sr-only">
              Tìm kiếm đơn hàng
            </label>
            <div className="orders-input-wrap">
              <Search size={15} className="text-stone-400 flex-shrink-0 mr-2" aria-hidden="true" />
              <input
                id="order-search-input"
                name="orderSearch"
                type="search"
                autoComplete="off"
                spellCheck={false}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Mã đơn, tên khách, SĐT, tên món…"
              />
            </div>
          </div>

          {/* Chọn loại đơn / Kênh */}
          <div>
            <label htmlFor="order-channel-select" className="sr-only">
              Lọc theo loại đơn
            </label>
            <select
              id="order-channel-select"
              name="channelFilter"
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="orders-select-control"
            >
              <option value="">— Tất cả loại đơn —</option>
              <option value="POS">Tại quầy (POS)</option>
              <option value="ONLINE">Giao hàng / Mang đi (Online)</option>
            </select>
          </div>

          {/* Lọc theo ngày */}
          <div>
            <label htmlFor="order-date-input" className="sr-only">
              Lọc theo ngày đặt
            </label>
            <input
              id="order-date-input"
              name="orderDate"
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="orders-date-control"
              title="Lọc theo ngày cụ thể"
            />
          </div>

          {/* Chọn nguồn đơn */}
          <div>
            <label htmlFor="order-source-select" className="sr-only">
              Lọc theo nguồn đơn
            </label>
            <select
              id="order-source-select"
              name="sourceFilter"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="orders-select-control"
            >
              <option value="">— Tất cả nguồn —</option>
              <option value="CUSTOMER">Khách tự đặt</option>
              <option value="STAFF">Nhân viên tạo</option>
            </select>
          </div>

          {/* Nút reset */}
          <div>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="orders-reset-button"
              aria-label="Xóa bộ lọc tìm kiếm"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Xóa lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Main Orders Bento Table Panel ── */}
      <div className="stats-bento-panel">
        <div className="stats-panel-header">
          <div>
            <h3 className="stats-panel-title">
              <PackageCheck size={18} className="text-purple-800" aria-hidden="true" />
              Danh Sách Đơn Hàng
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Hiển thị {filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filteredOrders.length)} trên tổng số {filteredOrders.length} đơn hàng phù hợp.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-900 rounded-full border border-purple-200 tabular-nums">
            Trang {safePage}/{totalPages}
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center text-xs text-stone-500" aria-live="polite">
            Đang tải danh sách đơn hàng…
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center" role="status">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-800 mb-3">
              <Receipt size={32} aria-hidden="true" />
            </div>
            <h4 className="text-sm font-bold text-stone-800">Không tìm thấy đơn hàng nào</h4>
            <p className="mt-1 max-w-sm text-xs text-stone-500">
              {hasActiveFilters
                ? 'Thử thay đổi từ khóa hoặc xóa bộ lọc để xem các đơn hàng khác.'
                : 'Đơn hàng mới từ khách hoặc nhân viên sẽ tự động hiển thị tại đây.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5C4174] text-white text-xs font-bold hover:bg-[#3f1c54] transition-colors cursor-pointer"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="stats-table-wrapper hidden lg:block">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>Đơn hàng</th>
                    <th style={{ textAlign: 'left' }}>Khách hàng / Người tạo</th>
                    <th>Loại đơn / Kênh</th>
                    <th style={{ textAlign: 'center' }}>Tiến độ pha chế</th>
                    <th>Thanh toán</th>
                    <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((order) => {
                    const normStatus = normalizeStatus(order.orderStatus);
                    const cfg = STATUS_CFG[normStatus] || STATUS_CFG.NEW;
                    const ch = getChannel(order.shippingAddress);
                    const custInfo = getOrderCustomerInfo(order);
                    const barista = computeBaristaProgress(order.items);
                    const isPaid = normStatus === 'COMPLETED' || ch.isPos;

                    return (
                      <tr
                        key={order.id}
                        tabIndex={0}
                        role="button"
                        onClick={() => setSelectedOrder(order)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedOrder(order);
                          }
                        }}
                        className={`order-table-row ${cfg.rowBorderCls}`}
                        aria-label={`Xem chi tiết đơn hàng số ${order.id}`}
                      >
                        {/* Cột 1: Mã đơn & Thời gian */}
                        <td style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>
                          <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 tabular-nums">
                            #{String(order.id).padStart(4, '0')}
                          </span>
                          <div className="mt-1 text-[11px] text-stone-500 flex items-center gap-1">
                            <Clock size={11} className="text-stone-400" aria-hidden="true" />
                            <span>{formatTimeAgo(order.createdAt)}</span>
                            <span>·</span>
                            <span className="font-semibold text-stone-700">{getItemCount(order)} món</span>
                          </div>
                        </td>

                        {/* Cột 2: Khách hàng / Người tạo */}
                        <td style={{ textAlign: 'left', maxWidth: '15rem' }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                custInfo.isPos
                                  ? 'bg-amber-100 text-amber-900 border-amber-200'
                                  : 'bg-purple-100 text-purple-900 border-purple-200'
                              }`}
                            >
                              {custInfo.isPos ? (
                                <UserCheck size={10} aria-hidden="true" />
                              ) : (
                                <User size={10} aria-hidden="true" />
                              )}
                              <span>{custInfo.badge}</span>
                            </span>
                          </div>
                          <p className="font-bold text-xs text-stone-900 truncate" title={custInfo.title}>
                            {custInfo.title}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5" title={custInfo.subtitle}>
                            {custInfo.subtitle}
                          </p>
                        </td>

                        {/* Cột 3: Loại đơn / Kênh */}
                        <td>
                          <span className={`channel-pill ${ch.isPos ? 'pos' : 'online'}`}>
                            {ch.label}
                          </span>
                        </td>

                        {/* Cột 4: Pha chế (Barista) */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold tabular-nums text-stone-700">
                              {barista.label} ly đã pha
                            </span>
                            <div className="table-barista-bar-track" aria-hidden="true">
                              <div
                                className={`table-barista-bar-fill ${barista.isComplete ? 'done' : ''}`}
                                style={{ width: `${barista.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Cột 5: Thanh toán */}
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </td>

                        {/* Cột 6: Tổng tiền */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono text-xs font-black text-stone-900 tabular-nums">
                            {formatPrice(order.totalPrice)}
                          </span>
                        </td>

                        {/* Cột 7: Trạng thái */}
                        <td>
                          <span className={`status-badge ${cfg.badgeCls}`}>
                            {cfg.label}
                          </span>
                        </td>

                        {/* Cột 8: Thao tác */}
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="accessible-action-btn"
                            aria-label={`Xem chi tiết đơn hàng số ${order.id}`}
                            title="Xem chi tiết đơn"
                          >
                            <Eye size={14} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="space-y-3 p-4 lg:hidden">
              {pageData.map((order) => {
                const normStatus = normalizeStatus(order.orderStatus);
                const cfg = STATUS_CFG[normStatus] || STATUS_CFG.NEW;
                const ch = getChannel(order.shippingAddress);
                const custInfo = getOrderCustomerInfo(order);
                const barista = computeBaristaProgress(order.items);
                const isPaid = normStatus === 'COMPLETED' || ch.isPos;

                return (
                  <article
                    key={`mob-${order.id}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedOrder(order)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedOrder(order);
                      }
                    }}
                    className={`order-table-row p-3.5 bg-white rounded-xl border border-stone-200 shadow-xs ${cfg.rowBorderCls}`}
                    aria-label={`Đơn hàng số ${order.id}`}
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 mb-2.5">
                      <div>
                        <span className="font-mono text-xs font-black text-purple-900 tabular-nums">
                          #{String(order.id).padStart(4, '0')}
                        </span>
                        <span className="ml-2 text-[11px] text-stone-500">{formatTimeAgo(order.createdAt)}</span>
                      </div>
                      <span className={`status-badge ${cfg.badgeCls}`}>{cfg.label}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                              custInfo.isPos
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : 'bg-purple-100 text-purple-900 border-purple-200'
                            }`}
                          >
                            {custInfo.badge}
                          </span>
                          <span className="font-bold text-stone-900 truncate">
                            {custInfo.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">{custInfo.subtitle}</p>
                      </div>
                      <span className={`channel-pill ${ch.isPos ? 'pos' : 'online'}`}>
                        {ch.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-stone-500 tabular-nums">{barista.label} ly đã pha</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isPaid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                      <span className="text-[11px] text-stone-500 tabular-nums">
                        {getItemCount(order)} món
                      </span>
                      <span className="font-mono font-bold text-stone-900 tabular-nums">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-stone-50/70 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="font-medium text-stone-500 tabular-nums">
                Hiển thị {filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredOrders.length)} / {filteredOrders.length} đơn hàng
              </span>

              <div className="flex items-center gap-1.5" role="navigation" aria-label="Phân trang danh sách đơn hàng">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Chuyển đến trang trước"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) p = i + 1;
                  else if (safePage <= 3) p = i + 1;
                  else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
                  else p = safePage - 2 + i;

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === safePage ? 'page' : undefined}
                      className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer tabular-nums ${
                        p === safePage
                          ? 'bg-[#5C4174] text-white shadow-xs'
                          : 'text-stone-700 hover:bg-white border border-stone-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Chuyển đến trang tiếp theo"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 6. Detail Modal ── */}
      {selectedOrder && (
        <AdminOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={async (orderId, newStatus) => {
            if (onUpdateStatus) {
              await onUpdateStatus(orderId, newStatus);
            }
            setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
          }}
        />
      )}
    </div>
  );
};

export default AdminOrders;
