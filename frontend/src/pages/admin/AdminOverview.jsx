import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ClipboardList,
  UtensilsCrossed,
  Users,
  Clock,
  Eye,
  Plus,
  BarChart3,
  Store,
  Globe,
  Sparkles,
} from 'lucide-react';
import { formatPrice, formatTimeAgo } from '../../utils/format';
import AdminOrderDetailModal from './components/AdminOrderDetailModal';
import './AdminOverview.css';

const STATUS_CONFIG = {
  NEW: { label: 'Đơn mới', cls: 'badge-new' },
  PROCESSING: { label: 'Đang pha chế', cls: 'badge-processing' },
  SHIPPING: { label: 'Đang giao', cls: 'badge-shipping' },
  COMPLETED: { label: 'Hoàn tất', cls: 'badge-completed' },
  CANCEL: { label: 'Đã hủy', cls: 'badge-cancel' },
};

const getOrderChannel = (address) => {
  if (!address) return { label: 'Online App', isPos: false, icon: <Globe size={14} />, cls: 'channel-online' };
  const lower = address.toLowerCase();
  if (lower.includes('pos') || lower.includes('tại quầy') || lower.includes('quầy')) {
    return { label: 'Tại quầy POS', isPos: true, icon: <Store size={14} />, cls: 'channel-pos' };
  }
  return { label: 'Online App', isPos: false, icon: <Globe size={14} />, cls: 'channel-online' };
};

const AdminOverview = ({ stats, orders = [], usersList = [], onOpenAddProduct }) => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Doanh thu theo kênh
  const completedOrdersList = orders.filter((o) => o.orderStatus === 'COMPLETED');
  const posOrders = completedOrdersList.filter((o) => getOrderChannel(o.shippingAddress).isPos);
  const onlineOrders = completedOrdersList.filter((o) => !getOrderChannel(o.shippingAddress).isPos);

  const posRev = posOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const onlineRev = onlineOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const calcTotalRev = stats?.totalRevenue || (posRev + onlineRev);

  // Top món bán chạy
  const salesMap = {};
  orders.forEach((o) => {
    if (o.orderStatus === 'COMPLETED' || o.orderStatus === 'SHIPPING' || o.orderStatus === 'PROCESSING') {
      o.items?.forEach((item) => {
        const name = item.productName || 'Món nước';
        if (!salesMap[name]) salesMap[name] = { name, quantity: 0, revenue: 0, image: item.productImage };
        salesMap[name].quantity += item.quantity || 1;
        salesMap[name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    }
  });
  const topProducts = Object.values(salesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const newOrdersCount = orders.filter((o) => o.orderStatus === 'NEW').length;
  const adminUsersCount = usersList.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="admin-tab-content animate-fade-in">
      {/* ── Hero Banner (Matching AdminStats) ── */}
      <div className="admin-hero-banner">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider rounded-full border border-amber-500/30 mb-2.5">
            <Sparkles size={13} /> Tổng quan vận hành quán
          </div>
          <h1 className="admin-hero-title">
            Trung Tâm Điều Hành Túc Tắc
          </h1>
          <p className="admin-hero-subtitle">
            Theo dõi tổng doanh thu, tiến độ đơn hàng theo thời gian thực và phân tích kênh bán hàng POS / Online.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/stats')}
            className="stats-action-btn"
          >
            <BarChart3 size={17} />
            Thống Kê Doanh Thu
          </button>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="stats-action-btn"
            style={{ background: '#d97706', color: '#ffffff' }}
          >
            <Plus size={17} />
            Tạo Món Mới
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards Grid (Matching AdminStats) ── */}
      <div className="stats-cards-grid">
        {/* Card 1: Tổng Doanh Thu */}
        <div className="stat-tile accent-taro flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tổng doanh thu</p>
            <div className="icon-tile ml-2">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{formatPrice(calcTotalRev)}</h3>
            <div className="stats-card-caption">
              <span className="trend-chip">+12.5%</span>
              Tổng từ các đơn hoàn thành
            </div>
          </div>
        </div>

        {/* Card 2: Tổng Đơn Hàng */}
        <div className="stat-tile accent-caramel flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tổng đơn hàng</p>
            <div className="icon-tile ml-2">
              <ClipboardList size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{stats?.totalOrders || orders.length || 0}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">
                {newOrdersCount} đơn mới
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Cần xử lý
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Món Best-seller */}
        <div className="stat-tile accent-matcha flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Món Best-seller</p>
            <div className="icon-tile ml-2">
              <UtensilsCrossed size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value" title={topProducts[0]?.name || 'Trà Sữa'}>
              {topProducts[0]?.name || 'Trà Sữa'}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">
                ✨ {topProducts[0]?.quantity || 0} ly đã bán
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Top #1
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Thành viên */}
        <div className="stat-tile accent-teal flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Thành viên hệ thống</p>
            <div className="icon-tile ml-2">
              <Users size={18} />
            </div>
          </div>
          <div>
            <h3 className="stat-tile-value">{usersList.length || 0}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-stone-700">
                {adminUsersCount} Quản trị viên
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Channel Breakdown 2 Cards ── */}
      <div className="overview-channel-grid">
        <div className="overview-channel-card pos">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center text-xl font-black shadow-xs">
              <Store size={24} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">Doanh thu tại quầy POS</p>
              <h4 className="text-2xl font-black text-stone-900 mt-0.5">{formatPrice(posRev)}</h4>
              <p className="text-xs text-stone-500 font-medium mt-0.5">{posOrders.length} đơn hoàn thành</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Mở POS Quầy →
          </button>
        </div>

        <div className="overview-channel-card online">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center text-xl font-black shadow-xs">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-800">Doanh thu Đơn Online</p>
              <h4 className="text-2xl font-black text-stone-900 mt-0.5">{formatPrice(onlineRev)}</h4>
              <p className="text-xs text-stone-500 font-medium mt-0.5">{onlineOrders.length} đơn giao hàng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Xem Đơn Online →
          </button>
        </div>
      </div>

      {/* ── Main Analysis Grid: Top Products (2 cols) + Recent Activities (1 col) ── */}
      <div className="stats-main-grid">
        {/* Left Bento: Top Selling Products */}
        <div className="stats-bento-panel flex flex-col">
          <div className="stats-panel-header">
            <div>
              <h3 className="stats-panel-title">
                <UtensilsCrossed size={18} className="text-amber-600" />
                Top Món Bán Chạy Nhất
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Xếp hạng các món đồ uống có lượng tiêu thụ cao nhất.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Quản lý tất cả món →
            </button>
          </div>

          <div className="stats-table-wrapper flex-1">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>Món ăn / Đồ uống</th>
                  <th>Số lượng bán</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-stone-400 text-xs">
                      Chưa có dữ liệu bán hàng
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={p.name}>
                      <td style={{ textAlign: 'left', paddingLeft: '1.25rem' }}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-extrabold text-stone-900 text-sm">{p.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {p.quantity} ly
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <span className="font-mono text-sm font-black text-emerald-700">
                          {formatPrice(p.revenue)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Bento: Recent Activities */}
        <div className="stats-bento-panel flex flex-col">
          <div className="stats-panel-header">
            <div>
              <h3 className="stats-panel-title">
                <Clock size={18} className="text-purple-600" />
                Hoạt Động Gần Đây
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Các đơn đặt hàng mới nhất
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          <div className="overview-activity-feed flex-1">
            {orders.slice(0, 6).map((ord) => {
              const badge = STATUS_CONFIG[ord.orderStatus] || { label: ord.orderStatus, cls: 'badge-new' };
              const channel = getOrderChannel(ord.shippingAddress);

              return (
                <div key={ord.id} className="overview-activity-item">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-base flex-shrink-0 text-stone-700">
                      {channel.icon}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-stone-900">#{ord.id}</span>
                        <span className={`status-badge ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                        <Clock size={11} />
                        <span>{formatTimeAgo(ord.createdAt)}</span>
                        <span>•</span>
                        <span className="font-bold text-stone-700">{formatPrice(ord.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    className="action-icon-btn flex-shrink-0"
                    title="Xem chi tiết đơn"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              );
            })}

            {orders.length === 0 && (
              <p className="text-center text-xs text-stone-400 py-12">Chưa có đơn hàng nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default AdminOverview;
