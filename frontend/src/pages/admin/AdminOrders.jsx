import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Store,
  Globe,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  PackageCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { formatPrice, formatTimeAgo } from '../../utils/format';
import AdminOrderDetailModal from './components/AdminOrderDetailModal';
import './AdminOrders.css';

/* ─── Status Config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  NEW:        { label: 'Đơn mới',      cls: 'badge-new' },
  PROCESSING: { label: 'Đang pha chế', cls: 'badge-processing' },
  SHIPPING:   { label: 'Đang giao',    cls: 'badge-shipping' },
  COMPLETED:  { label: 'Hoàn tất',     cls: 'badge-completed' },
  CANCEL:     { label: 'Đã hủy',       cls: 'badge-cancel' },
};

/* Màu avatar theo index */
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-rose-100 text-rose-800',
  'bg-indigo-100 text-indigo-800',
];

const getInitials = (email, id) => {
  if (!email) return `#${String(id).slice(-2)}`;
  const parts = email.split('@')[0].split(/[._\-]/);
  return parts.map(p => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');
};

const getChannel = (addr) => {
  if (!addr) return { label: 'Online App', isPos: false, icon: <Globe size={13} /> };
  const l = addr.toLowerCase();
  return l.includes('pos') || l.includes('tại quầy') || l.includes('quầy')
    ? { label: 'Tại quầy (POS)', isPos: true, icon: <Store size={13} /> }
    : { label: 'Online App', isPos: false, icon: <Globe size={13} /> };
};

const PAGE_SIZE = 10;

const AdminOrders = ({ orders = [], loading = false, onUpdateStatus }) => {
  const navigate = useNavigate();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [dateFilter, setDate]       = useState('');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);

  // Status counters
  const totalCount = orders.length;
  const newCount = orders.filter(o => o.orderStatus === 'NEW').length;
  const processingCount = orders.filter(o => o.orderStatus === 'PROCESSING').length;
  const shippingCount = orders.filter(o => o.orderStatus === 'SHIPPING').length;
  const completedCount = orders.filter(o => o.orderStatus === 'COMPLETED').length;

  /* Lọc */
  const filtered = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) => (b.id ?? 0) - (a.id ?? 0) || new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted.filter(o => {
      const q = search.trim().toLowerCase();
      if (q && !String(o.id).includes(q) &&
          !o.shippingAddress?.toLowerCase().includes(q) &&
          !o.items?.some(i => i.productName?.toLowerCase().includes(q))) return false;
      if (statusFilter && o.orderStatus !== statusFilter) return false;
      if (dateFilter) {
        const d = new Date(o.createdAt).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, dateFilter]);

  /* Phân trang */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const gotoPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  /* Reset page khi lọc thay đổi */
  const handleSearch  = (v) => { setSearch(v);  setPage(1); };
  const handleStatus  = (v) => { setStatus(v);  setPage(1); };
  const handleDate    = (v) => { setDate(v);    setPage(1); };

  return (
    <div className="admin-tab-content animate-fade-in">
      {/* ── Hero Banner (Matching AdminStats) ── */}
      <div className="admin-hero-banner">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider rounded-full border border-amber-500/30 mb-2.5">
            <Sparkles size={13} /> Điều phối & Giám sát đơn hàng
          </div>
          <h1 className="admin-hero-title">
            Quản Lý Đơn Hàng
          </h1>
          <p className="admin-hero-subtitle">
            Theo dõi, tìm kiếm và cập nhật trạng thái đơn hàng toàn hệ thống theo thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Filter Bar inside Hero */}
          <div className="admin-filter-bar" role="group" aria-label="Bộ lọc trạng thái">
            <button
              type="button"
              onClick={() => handleStatus('')}
              className={`admin-filter-btn ${statusFilter === '' ? 'active' : ''}`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => handleStatus('NEW')}
              className={`admin-filter-btn ${statusFilter === 'NEW' ? 'active' : ''}`}
            >
              Đơn mới ({newCount})
            </button>
            <button
              type="button"
              onClick={() => handleStatus('PROCESSING')}
              className={`admin-filter-btn ${statusFilter === 'PROCESSING' ? 'active' : ''}`}
            >
              Đang pha ({processingCount})
            </button>
            <button
              type="button"
              onClick={() => handleStatus('SHIPPING')}
              className={`admin-filter-btn ${statusFilter === 'SHIPPING' ? 'active' : ''}`}
            >
              Đang giao ({shippingCount})
            </button>
            <button
              type="button"
              onClick={() => handleStatus('COMPLETED')}
              className={`admin-filter-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            >
              Hoàn tất ({completedCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="stats-action-btn"
            style={{ background: '#10b981', color: '#ffffff' }}
          >
            <Plus size={16} />
            Tạo Đơn POS
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards Grid ── */}
      <div className="stats-cards-grid">
        {/* Card 1: Tổng số đơn */}
        <div className="stat-tile accent-taro flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tổng đơn hàng</p>
            <div className="icon-tile ml-2">
              <PackageCheck size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{totalCount}</h3>
            <div className="stats-card-caption">
              Toàn bộ đơn hàng đã ghi nhận
            </div>
          </div>
        </div>

        {/* Card 2: Chờ pha chế */}
        <div className="stat-tile accent-caramel flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Cần pha chế</p>
            <div className="icon-tile ml-2">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{newCount + processingCount}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">
                {newCount} mới · {processingCount} đang pha
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Barista
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Đang giao hàng */}
        <div className="stat-tile accent-teal flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Đang giao hàng</p>
            <div className="icon-tile ml-2">
              <Truck size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{shippingCount}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">
                Đang trên đường giao
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Shipper
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Hoàn thành */}
        <div className="stat-tile accent-matcha flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Đã hoàn thành</p>
            <div className="icon-tile ml-2">
              <Store size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{completedCount}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">
                Tỷ lệ: {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Thành công
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Utility Filter Bar ── */}
      <div className="orders-filter-container">
        <div className="orders-filter-fields">
          {/* Search box */}
          <div className="admin-search-input-group">
            <Search size={16} className="text-stone-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, địa chỉ, khách hàng, tên món..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => handleSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatus(e.target.value)}
            className="orders-select-field"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_CFG).map(([k, c]) => (
              <option key={k} value={k}>{c.label}</option>
            ))}
          </select>

          {/* Date Picker */}
          <div className="orders-date-field">
            <CalendarDays size={15} className="text-stone-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDate(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filter button */}
        {(search || statusFilter || dateFilter) && (
          <button
            type="button"
            onClick={() => { handleSearch(''); handleStatus(''); handleDate(''); }}
            className="px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw size={13} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* ── Bento Panel Table (Matching AdminStats) ── */}
      <div className="stats-bento-panel">
        <div className="stats-panel-header">
          <div>
            <h3 className="stats-panel-title">
              <PackageCheck size={18} className="text-purple-700" />
              Danh Sách Đơn Hàng
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Hiển thị {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)} trên tổng số {filtered.length} đơn hàng phù hợp.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200">
            Trang {safePage}/{totalPages}
          </span>
        </div>

        <div className="stats-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>Mã đơn</th>
                <th>Kênh</th>
                <th style={{ textAlign: 'left' }}>Khách hàng & Địa chỉ</th>
                <th style={{ textAlign: 'left' }}>Món gọi</th>
                <th style={{ textAlign: 'right' }}>Thành tiền</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-stone-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-stone-400 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={28} className="text-stone-300" />
                      <p className="font-bold text-stone-700 text-sm">Không tìm thấy đơn hàng nào</p>
                      <p className="text-stone-400">Hãy thử thay đổi từ khóa hoặc điều kiện lọc ngày.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((ord, rowIdx) => {
                  const cfg = STATUS_CFG[ord.orderStatus] ?? { label: ord.orderStatus, cls: 'badge-new' };
                  const ch = getChannel(ord.shippingAddress);
                  const avatarCl = AVATAR_COLORS[(ord.id ?? rowIdx) % AVATAR_COLORS.length];
                  const initials = getInitials(ord.customerEmail, ord.id);
                  const itemsText = ord.items?.map(i => `${i.quantity}× ${i.productName}`).join(', ') ?? '—';

                  return (
                    <tr key={ord.id}>
                      {/* Mã đơn */}
                      <td style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>
                        <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                          #{String(ord.id).padStart(4, '0')}
                        </span>
                      </td>

                      {/* Kênh */}
                      <td>
                        <span className={`channel-pill ${ch.isPos ? 'pos' : 'online'}`}>
                          {ch.icon} {ch.label}
                        </span>
                      </td>

                      {/* Khách hàng & Địa chỉ */}
                      <td style={{ textAlign: 'left', maxWidth: '220px' }}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarCl}`}>
                            {initials}
                          </div>
                          <span className="text-xs font-medium text-stone-800 line-clamp-1" title={ord.shippingAddress}>
                            {ord.shippingAddress || 'Khách vãng lai'}
                          </span>
                        </div>
                      </td>

                      {/* Món gọi */}
                      <td style={{ textAlign: 'left', maxWidth: '240px' }}>
                        <span className="text-xs text-stone-600 line-clamp-1" title={itemsText}>
                          {itemsText}
                        </span>
                      </td>

                      {/* Thành tiền */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-mono text-sm font-black text-stone-900">
                          {formatPrice(ord.totalPrice)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td>
                        <span className={`status-badge ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td>
                        <div className="flex flex-col items-center gap-0.5 text-xs text-stone-500">
                          <span className="font-medium flex items-center gap-1 text-stone-700 text-[11px]">
                            <Clock size={11} className="text-stone-400" />
                            {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-stone-400">{formatTimeAgo(ord.createdAt)}</span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={ord.orderStatus}
                            onChange={(e) => onUpdateStatus(ord.id, e.target.value)}
                            disabled={ord.orderStatus === 'COMPLETED' || ord.orderStatus === 'CANCEL'}
                            className="order-table-status-select"
                          >
                            <option value="NEW">Đơn mới</option>
                            <option value="PROCESSING">Đang pha chế</option>
                            <option value="SHIPPING">Đang giao</option>
                            <option value="COMPLETED">Hoàn tất</option>
                            <option value="CANCEL">Hủy đơn</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setSelected(ord)}
                            className="action-icon-btn flex-shrink-0"
                            title="Xem chi tiết đơn"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-stone-50/60 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">
            Hiển thị {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} đơn hàng
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => gotoPage(safePage - 1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (safePage <= 3) {
                p = i + 1;
              } else if (safePage >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = safePage - 2 + i;
              }
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => gotoPage(p)}
                  className={`w-8 h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    p === safePage
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-white border border-stone-200'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => gotoPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && <AdminOrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AdminOrders;
