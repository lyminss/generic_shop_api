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
  Printer,
  Copy,
  Check,
  Coffee,
  Calendar,
  CreditCard,
  Tag,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatPrice, formatTimeAgo, formatDateTime } from '../../utils/format';
import {
  ORDER_STATUS_CONFIG,
  normalizeOrderStatus,
  getOrderChannel,
  getOrderCustomerInfo,
} from '../../utils/orderHelpers';
import AdminOrderDetailModal from './components/AdminOrderDetailModal';
import PrintBillModal from '../../components/common/PrintBillModal';
import { useToast } from '../../context/ToastContext';
import './AdminOrders.css';

const STATUS_CFG = ORDER_STATUS_CONFIG;
const normalizeStatus = normalizeOrderStatus;
const getChannel = getOrderChannel;

const PAGE_SIZE = 10;

const AdminOrders = ({ orders = [], loading = false, onUpdateStatus }) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const handleCopy = (id, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Summary Metrics
  const summary = useMemo(() => {
    const total = orders.length;
    let pending = 0;
    let processing = 0;
    let shipping = 0;
    let completed = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      const st = normalizeStatus(o.orderStatus);
      if (st === 'NEW') pending++;
      else if (st === 'PROCESSING') processing++;
      else if (st === 'SHIPPING') shipping++;
      else if (st === 'COMPLETED') {
        completed++;
        totalRevenue += Number(o.totalPrice || 0);
      } else if (st === 'CANCEL') cancelled++;
    });

    return { total, pending, processing, shipping, completed, cancelled, totalRevenue };
  }, [orders]);

  // Status Tabs Definition
  const statusTabs = [
    { value: '', label: 'Tất cả', count: summary.total },
    { value: 'NEW', label: 'Chờ duyệt', count: summary.pending, color: 'text-amber-700 bg-amber-50' },
    { value: 'PROCESSING', label: 'Đang pha chế', count: summary.processing, color: 'text-purple-700 bg-purple-50' },
    { value: 'SHIPPING', label: 'Đang giao', count: summary.shipping, color: 'text-teal-700 bg-teal-50' },
    { value: 'COMPLETED', label: 'Hoàn thành', count: summary.completed, color: 'text-emerald-700 bg-emerald-50' },
    { value: 'CANCEL', label: 'Đã hủy', count: summary.cancelled, color: 'text-rose-700 bg-rose-50' },
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
        const custMatch = (o.customerEmail || o.customerName || o.customerPhone || '').toLowerCase().includes(q);
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

      if (paymentFilter) {
        const isPaid = o.paymentStatus === 'PAID' || normalizeStatus(o.orderStatus) === 'COMPLETED' || getChannel(o.shippingAddress).isPos;
        if (paymentFilter === 'PAID' && !isPaid) return false;
        if (paymentFilter === 'UNPAID' && isPaid) return false;
        if (paymentFilter === 'QR_WAITING' && (isPaid || o.paymentMethod !== 'QR_TRANSFER')) return false;
      }

      if (dateFilter && o.createdAt) {
        const d = new Date(o.createdAt).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }

      return true;
    });
  }, [orders, search, statusFilter, channelFilter, paymentFilter, dateFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilters = Boolean(search || statusFilter || channelFilter || paymentFilter || dateFilter);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setChannelFilter('');
    setPaymentFilter('');
    setDateFilter('');
    setPage(1);
  };

  const handleQuickDate = (type) => {
    if (type === 'TODAY') {
      setDateFilter(new Date().toISOString().slice(0, 10));
    } else {
      setDateFilter('');
    }
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

  // Quick next status action on row
  const handleQuickNextStatus = async (e, order) => {
    e.stopPropagation();
    const current = normalizeStatus(order.orderStatus);
    let next = null;
    if (current === 'NEW') next = 'PROCESSING';
    else if (current === 'PROCESSING') next = 'SHIPPING';
    else if (current === 'SHIPPING') next = 'COMPLETED';

    if (!next || !onUpdateStatus) return;

    setUpdatingId(order.id);
    try {
      await onUpdateStatus(order.id, next);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-orders-content animate-fade-in">
      {/* ── 1. Hero Header ── */}
      <section className="orders-hero">
        <div className="orders-hero-left">
          <div className="orders-live-badge">
            <span className="orders-pulse-dot" />
            <span>Hệ thống thời gian thực</span>
          </div>
          <h1 className="orders-hero-title">Quản Lý Đơn Hàng</h1>
          <p className="orders-hero-subtitle">
            Giám sát đơn hàng, tiến độ pha chế của Barista và điều phối giao hàng cho khách.
          </p>
        </div>

        <div className="orders-hero-right">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="orders-btn-pos"
            title="Mở giao diện quầy bán hàng POS"
          >
            <Plus size={16} />
            <span>Tạo Đơn Tại Quầy</span>
          </button>
        </div>
      </section>

      {/* ── 2. Stat Tiles Grid (Clickable) ── */}
      <section className="orders-stats-grid" aria-label="Thống kê nhanh đơn hàng">
        {/* Tất cả */}
        <div
          className={`orders-stat-card border-l-stone ${statusFilter === '' ? 'is-selected' : ''}`}
          onClick={() => { setStatusFilter(''); setPage(1); }}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Tất cả đơn</span>
            <div className="stat-card-icon icon-stone"><Receipt size={17} /></div>
          </div>
          <div className="stat-card-val tabular-nums">{summary.total}</div>
          <div className="stat-card-foot">Doanh thu: {formatPrice(summary.totalRevenue)}</div>
        </div>

        {/* Chờ duyệt (NEW) */}
        <div
          className={`orders-stat-card border-l-amber ${statusFilter === 'NEW' ? 'is-selected' : ''}`}
          onClick={() => { setStatusFilter('NEW'); setPage(1); }}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Chờ duyệt</span>
            <div className="stat-card-icon icon-amber"><Clock size={17} /></div>
          </div>
          <div className="stat-card-val text-amber-700 tabular-nums">{summary.pending}</div>
          <div className="stat-card-foot">Cần tiếp nhận & xác nhận</div>
        </div>

        {/* Đang pha chế (PROCESSING) */}
        <div
          className={`orders-stat-card border-l-purple ${statusFilter === 'PROCESSING' ? 'is-selected' : ''}`}
          onClick={() => { setStatusFilter('PROCESSING'); setPage(1); }}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Đang pha chế</span>
            <div className="stat-card-icon icon-purple"><Coffee size={17} /></div>
          </div>
          <div className="stat-card-val text-purple-800 tabular-nums">{summary.processing}</div>
          <div className="stat-card-foot">Barista đang thực hiện</div>
        </div>

        {/* Đang giao (SHIPPING) */}
        <div
          className={`orders-stat-card border-l-teal ${statusFilter === 'SHIPPING' ? 'is-selected' : ''}`}
          onClick={() => { setStatusFilter('SHIPPING'); setPage(1); }}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Đang giao</span>
            <div className="stat-card-icon icon-teal"><Truck size={17} /></div>
          </div>
          <div className="stat-card-val text-teal-700 tabular-nums">{summary.shipping}</div>
          <div className="stat-card-foot">Sẵn sàng / Đang giao</div>
        </div>

        {/* Hoàn thành (COMPLETED) */}
        <div
          className={`orders-stat-card border-l-emerald ${statusFilter === 'COMPLETED' ? 'is-selected' : ''}`}
          onClick={() => { setStatusFilter('COMPLETED'); setPage(1); }}
        >
          <div className="stat-card-header">
            <span className="stat-card-label">Hoàn thành</span>
            <div className="stat-card-icon icon-emerald"><CheckCircle2 size={17} /></div>
          </div>
          <div className="stat-card-val text-emerald-700 tabular-nums">{summary.completed}</div>
          <div className="stat-card-foot">Giao dịch thành công</div>
        </div>
      </section>

      {/* ── 3. Status Tabs ── */}
      <div className="orders-status-tabs">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`status-tab-btn ${isActive ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="status-tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Search & Filter Bar ── */}
      <div className="orders-filters-container">
        <div className="orders-search-wrap">
          <Search size={16} className="text-stone-400 flex-shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn (#12), tên khách, SĐT, địa chỉ, món nước..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="orders-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="orders-filter-selects">
          {/* Kênh đơn */}
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="orders-select"
          >
            <option value="">Tất cả kênh</option>
            <option value="POS">Tại quầy (POS)</option>
            <option value="ONLINE">Giao hàng (Online)</option>
          </select>

          {/* Thanh toán */}
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="orders-select"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="QR_WAITING">⚠️ Chờ xác nhận QR</option>
          </select>

          {/* Ngày đặt */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="orders-select font-sans"
            title="Lọc theo ngày đặt"
          />

          {/* Nút lọc Hôm nay */}
          <button
            type="button"
            onClick={() => handleQuickDate(dateFilter ? '' : 'TODAY')}
            className={`orders-quick-btn ${dateFilter === new Date().toISOString().slice(0, 10) ? 'active' : ''}`}
          >
            Hôm nay
          </button>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="orders-reset-btn"
              title="Xóa tất cả bộ lọc"
            >
              <RotateCcw size={14} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 5. Main Orders Table ── */}
      <div className="orders-table-card">
        <div className="orders-table-header">
          <div>
            <h2 className="orders-table-title">
              <PackageCheck size={18} className="text-[#5C4174]" />
              <span>Danh Sách Đơn Hàng</span>
            </h2>
            <p className="orders-table-subtitle">
              Hiển thị {filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filteredOrders.length)} trên tổng số {filteredOrders.length} đơn hàng.
            </p>
          </div>

          <span className="orders-page-badge">
            Trang {safePage}/{totalPages}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-stone-500">
            <RefreshCw size={24} className="animate-spin text-purple-700 mx-auto mb-2" />
            Đang đồng bộ dữ liệu đơn hàng...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <div className="empty-icon-wrap">
              <Receipt size={32} />
            </div>
            <h4>Không tìm thấy đơn hàng nào phù hợp</h4>
            <p>
              {hasActiveFilters
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm Xóa lọc để xem lại tất cả.'
                : 'Đơn hàng mới từ khách hoặc nhân viên quầy sẽ tự động hiển thị tại đây.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="orders-btn-empty-reset"
              >
                <RotateCcw size={13} />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="orders-table-wrap hidden lg:block">
              <table className="orders-main-table">
                <thead>
                  <tr>
                    <th style={{ width: '13%' }}>Mã & Giờ</th>
                    <th style={{ width: '20%' }}>Khách hàng / Kênh</th>
                    <th style={{ width: '23%' }}>Món nước</th>
                    <th style={{ width: '13%', textAlign: 'center' }}>Tiến độ pha</th>
                    <th style={{ width: '14%' }}>Thanh toán</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Tổng tiền</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '13%', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((order) => {
                    const normStatus = normalizeStatus(order.orderStatus);
                    const cfg = STATUS_CFG[normStatus] || STATUS_CFG.NEW;
                    const ch = getChannel(order.shippingAddress);
                    const custInfo = getOrderCustomerInfo(order);
                    const barista = computeBaristaProgress(order.items);
                    const isPaid = order.paymentStatus === 'PAID' || normStatus === 'COMPLETED' || ch.isPos;
                    const isUpdating = updatingId === order.id;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`order-row ${cfg.rowBorderCls}`}
                      >
                        {/* Cột 1: Mã & Thời gian */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="order-id-badge">
                              #{String(order.id).padStart(4, '0')}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(order.id, e)}
                              className="order-copy-btn"
                              title="Sao chép mã đơn"
                            >
                              {copiedId === order.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div className="order-time-text">
                            <Clock size={11} className="text-stone-400" />
                            <span>{formatTimeAgo(order.createdAt)}</span>
                          </div>
                        </td>

                        {/* Cột 2: Khách hàng / Kênh */}
                        <td>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`channel-tag ${ch.isPos ? 'pos' : 'online'}`}>
                              {ch.isPos ? <UserCheck size={10} /> : <User size={10} />}
                              <span>{ch.isPos ? 'Bán tại quầy' : 'Khách online'}</span>
                            </span>
                          </div>
                          <p className="order-cust-name" title={custInfo.title}>
                            {custInfo.title}
                          </p>
                          <p className="order-cust-sub" title={custInfo.subtitle}>
                            {custInfo.subtitle}
                          </p>
                        </td>

                        {/* Cột 3: Món nước */}
                        <td>
                          <div className="order-items-preview">
                            {order.items?.slice(0, 2).map((item, i) => (
                              <div key={item.id ?? i} className="order-item-snippet truncate">
                                <strong>{item.quantity}x</strong> {item.productName}
                              </div>
                            ))}
                            {(order.items?.length || 0) > 2 && (
                              <span className="order-more-items">
                                +{(order.items?.length || 0) - 2} món khác
                              </span>
                            )}
                          </div>
                          <span className="order-item-count-tag">
                            Tổng {getItemCount(order)} ly
                          </span>
                        </td>

                        {/* Cột 4: Tiến độ pha */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="order-barista-meter">
                            <span className="barista-label tabular-nums">
                              {barista.label} ly xong
                            </span>
                            <div className="barista-bar-track">
                              <div
                                className={`barista-bar-fill ${barista.isComplete ? 'done' : ''}`}
                                style={{ width: `${barista.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Cột 5: Thanh toán */}
                        <td>
                          <div className="order-payment-type">
                            {order.paymentMethod === 'QR_TRANSFER' ? 'VietQR' : 'Tiền mặt'}
                          </div>
                          <span className={`order-paid-badge ${
                            isPaid
                              ? 'paid'
                              : (order.paymentMethod === 'QR_TRANSFER' ? 'qr-waiting' : 'unpaid')
                          }`}>
                            {isPaid ? 'Đã nhận tiền' : (order.paymentMethod === 'QR_TRANSFER' ? 'Chờ nhận QR' : 'Chưa thu tiền')}
                          </span>
                        </td>

                        {/* Cột 6: Tổng tiền */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="order-total-price font-mono tabular-nums">
                            {formatPrice(order.totalPrice)}
                          </div>
                          {order.voucherCode && (
                            <div className="order-voucher-tag" title={`Đã giảm ${formatPrice(order.discountAmount || 0)}`}>
                              <Tag size={9} /> {order.voucherCode}
                            </div>
                          )}
                        </td>

                        {/* Cột 7: Trạng thái */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge-modern ${cfg.badgeCls}`}>
                            <span className={`status-dot ${cfg.dotCls}`} />
                            <span>{cfg.label}</span>
                          </span>
                        </td>

                        {/* Cột 8: Thao tác nhanh */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Quick Next Status button */}
                            {normStatus === 'NEW' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={(e) => handleQuickNextStatus(e, order)}
                                className="order-btn-next-step"
                                title="Duyệt đơn và chuyển pha chế"
                              >
                                {isUpdating ? '...' : 'Duyệt'}
                              </button>
                            )}
                            {normStatus === 'PROCESSING' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={(e) => handleQuickNextStatus(e, order)}
                                className="order-btn-next-step btn-teal"
                                title="Sẵn sàng / Đang giao"
                              >
                                {isUpdating ? '...' : 'Giao'}
                              </button>
                            )}
                            {normStatus === 'SHIPPING' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={(e) => handleQuickNextStatus(e, order)}
                                className="order-btn-next-step btn-emerald"
                                title="Hoàn thành đơn"
                              >
                                {isUpdating ? '...' : 'Xong'}
                              </button>
                            )}

                            {/* In bill */}
                            <button
                              type="button"
                              onClick={() => setPrintOrder(order)}
                              className="order-action-icon-btn text-amber-700 hover:bg-amber-50"
                              title="In bill"
                            >
                              <Printer size={14} />
                            </button>

                            {/* Chi tiết */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="order-action-icon-btn text-stone-700 hover:bg-stone-100"
                              title="Xem chi tiết đơn"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="orders-mobile-list lg:hidden">
              {pageData.map((order) => {
                const normStatus = normalizeStatus(order.orderStatus);
                const cfg = STATUS_CFG[normStatus] || STATUS_CFG.NEW;
                const ch = getChannel(order.shippingAddress);
                const custInfo = getOrderCustomerInfo(order);
                const barista = computeBaristaProgress(order.items);
                const isPaid = order.paymentStatus === 'PAID' || normStatus === 'COMPLETED' || ch.isPos;

                return (
                  <div
                    key={`m-${order.id}`}
                    onClick={() => setSelectedOrder(order)}
                    className={`order-mobile-card ${cfg.rowBorderCls}`}
                  >
                    <div className="mobile-card-top">
                      <div className="flex items-center gap-2">
                        <span className="order-id-badge">#{String(order.id).padStart(4, '0')}</span>
                        <span className="text-[11px] text-stone-500">{formatTimeAgo(order.createdAt)}</span>
                      </div>
                      <span className={`status-badge-modern ${cfg.badgeCls}`}>{cfg.label}</span>
                    </div>

                    <div className="mobile-card-middle">
                      <div>
                        <div className="font-bold text-xs text-stone-900">{custInfo.title}</div>
                        <div className="text-[11px] text-stone-500 truncate">{custInfo.subtitle}</div>
                      </div>
                      <span className={`channel-tag ${ch.isPos ? 'pos' : 'online'}`}>
                        {ch.isPos ? 'Tại quầy' : 'Online'}
                      </span>
                    </div>

                    <div className="mobile-card-foot">
                      <div className="text-[11px] text-stone-500">
                        {getItemCount(order)} món · {barista.label} ly xong
                      </div>
                      <div className="font-mono font-black text-sm text-stone-900">
                        {formatPrice(order.totalPrice)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="orders-pagination">
              <span className="pagination-info">
                Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredOrders.length)} / {filteredOrders.length} đơn hàng
              </span>

              <div className="pagination-nav">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="pagination-btn"
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
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
                      className={`pagination-num ${p === safePage ? 'active' : ''}`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="pagination-btn"
                  title="Trang sau"
                >
                  <ChevronRight size={16} />
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

      {/* ── 7. Print Bill Modal ── */}
      {printOrder && (
        <PrintBillModal
          isOpen={Boolean(printOrder)}
          onClose={() => setPrintOrder(null)}
          order={printOrder}
        />
      )}
    </div>
  );
};

export default AdminOrders;
