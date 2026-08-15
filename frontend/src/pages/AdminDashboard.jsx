import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminService, productService, orderService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatTimeAgo } from '../utils/format';
import { TableSkeleton, EmptyState, ErrorState } from '../components/common/StateViews';

import {
  LayoutDashboard,
  UtensilsCrossed,
  Boxes,
  ClipboardList,
  Users,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  PackageCheck,
  PackageX,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

import InventoryManagement from './InventoryManagement';
import './AdminDashboard.css';

const STATUS_BADGES = {
  NEW: { label: 'Đơn mới', cls: 'badge-new' },
  PROCESSING: { label: 'Đang chuẩn bị', cls: 'badge-processing' },
  SHIPPING: { label: 'Đang giao', cls: 'badge-shipping' },
  COMPLETED: { label: 'Hoàn thành', cls: 'badge-completed' },
  CANCEL: { label: 'Đã hủy', cls: 'badge-cancel' },
};

const getTabFromPath = (pathname) => {
  if (pathname.includes('/products')) return 'products';
  if (pathname.includes('/inventory')) return 'inventory';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/users')) return 'users';
  return 'stats';
};

const getOrderChannel = (address) => {
  if (!address) return { label: 'Online', isPos: false, icon: '🌐', cls: 'channel-online' };
  const lower = address.toLowerCase();
  if (lower.includes('pos') || lower.includes('tại quầy') || lower.includes('quầy')) {
    return { label: 'Tại quầy (POS)', isPos: true, icon: '🏪', cls: 'channel-pos' };
  }
  return { label: 'Online', isPos: false, icon: '🌐', cls: 'channel-online' };
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const toast = useToast();

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  // Data states
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderChannelFilter, setOrderChannelFilter] = useState(''); // '' | 'pos' | 'online'
  const [userSearch, setUserSearch] = useState('');

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = Add, productObj = Edit
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    stockQuantity: '',
    image: '',
    description: '',
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Selected Order for detail view modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Initial Load & Realtime Polling for Orders
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes, usersRes] = await Promise.all([
        adminService.getStats().catch(() => ({ data: null })),
        productService.getAll().catch(() => ({ data: [] })),
        orderService.getAllOrders().catch(() => ({ data: [] })),
        adminService.getUsers().catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setUsersList(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
      toast.error('Không thể tải dữ liệu quản trị');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchOrdersRealtime = useCallback(async () => {
    try {
      const ordersRes = await orderService.getAllOrders();
      if (ordersRes.data) {
        setOrders(ordersRes.data);
        setSelectedOrder((prev) => {
          if (!prev) return null;
          const updated = ordersRes.data.find((o) => o.id === prev.id);
          return updated || prev;
        });
      }
    } catch {
      // silent background refresh
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchOrdersRealtime, 4000);
    return () => clearInterval(interval);
  }, [fetchAllData, fetchOrdersRealtime]);

  // Auto-close open modals when switching tabs or navigating
  useEffect(() => {
    setSelectedOrder(null);
    setShowProductModal(false);
  }, [activeTab, location.pathname]);


  // Product Actions
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Trà Sữa',
      price: '',
      stockQuantity: '50',
      image: '',
      description: '',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      category: prod.category || '',
      price: prod.price || '',
      stockQuantity: prod.stockQuantity ?? 0,
      image: prod.image || '',
      description: prod.description || '',
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmittingProduct(true);

    const payload = {
      name: productForm.name,
      category: productForm.category || 'Trà Sữa',
      price: Number(productForm.price),
      stockQuantity: Number(productForm.stockQuantity),
      image: productForm.image,
      description: productForm.description,
    };

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
        toast.success(`Đã cập nhật món "${payload.name}"`);
      } else {
        await productService.createProduct(payload);
        toast.success(`Đã thêm món mới "${payload.name}"`);
      }
      setShowProductModal(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data || 'Thao tác thất bại');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa món "${prod.name}" không?`)) return;
    try {
      await productService.deleteProduct(prod.id);
      toast.success(`Đã xóa món "${prod.name}"`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể xóa món ăn');
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Đã cập nhật trạng thái đơn #${orderId} sang ${STATUS_BADGES[newStatus]?.label || newStatus}`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể cập nhật trạng thái đơn hàng');
    }
  };

  // User Role Action
  const handleToggleUserRole = async (userObj) => {
    const newRole = userObj.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionText = newRole === 'ADMIN' ? 'NÂNG QUYỀN ADMIN' : 'HẠ QUYỀN VỀ USER';
    if (!window.confirm(`Xác nhận ${actionText} cho tài khoản ${userObj.email}?`)) return;

    try {
      await adminService.updateUserRole(userObj.id, newRole);
      toast.success(`Đã cập nhật vai trò của ${userObj.email} thành ${newRole}`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data || 'Không thể thay đổi vai trò người dùng');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const matchStatus = orderStatusFilter === '' ? true : o.orderStatus === orderStatusFilter;
    const channel = getOrderChannel(o.shippingAddress);
    const matchChannel =
      orderChannelFilter === '' ? true : (orderChannelFilter === 'pos' ? channel.isPos : !channel.isPos);
    return matchStatus && matchChannel;
  });

  // Filtered Users
  const filteredUsers = usersList.filter(u =>
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.firstName + ' ' + u.lastName)?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner"></div>
          <p className="text-gray-500 font-medium">Đang tải dữ liệu quản trị Túc Tắc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container space-y-8">

      {/* ================= TAB 1: TỔNG QUAN & BIỂU ĐỒ DOANH THU ================= */}
      {activeTab === 'stats' && (() => {
        const completedOrdersList = orders.filter((o) => o.orderStatus === 'COMPLETED');
        const posOrders = completedOrdersList.filter((o) => getOrderChannel(o.shippingAddress).isPos);
        const onlineOrders = completedOrdersList.filter((o) => !getOrderChannel(o.shippingAddress).isPos);

        const posRev = posOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
        const onlineRev = onlineOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
        const calcTotalRev = stats?.totalRevenue || (posRev + onlineRev);
        const aov = completedOrdersList.length > 0 ? Math.round(calcTotalRev / completedOrdersList.length) : 0;

        const salesMap = {};
        orders.forEach((o) => {
          if (o.orderStatus === 'COMPLETED' || o.orderStatus === 'SHIPPING' || o.orderStatus === 'PROCESSING') {
            o.items?.forEach((item) => {
              const name = item.productName || 'Món nước';
              if (!salesMap[name]) salesMap[name] = { name, quantity: 0, revenue: 0 };
              salesMap[name].quantity += item.quantity || 1;
              salesMap[name].revenue += (item.price || 0) * (item.quantity || 1);
            });
          }
        });
        const topProducts = Object.values(salesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

        return (
          <div className="tab-content animate-fade-in space-y-7 w-full max-w-full overflow-hidden">
            {/* Main Action Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tổng quan</h2>
                <p className="text-sm text-gray-500 mt-1">Chào mừng trở lại, đây là thông tin hoạt động hôm nay.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => toast.success('Đã xuất báo cáo thành công!')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <TrendingUp size={16} />
                  Xuất báo cáo
                </button>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Tạo đơn mới
                </button>
              </div>
            </div>

            {/* Bento Grid Layout - Stat Cards (đồng bộ màu taro/caramel/matcha/teal) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {/* Stat Card 1 — Doanh thu */}
              <div className="stat-tile accent-taro flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 truncate">Tổng doanh thu</p>
                  <div className="icon-tile ml-2">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="stat-tile-value truncate">{formatPrice(calcTotalRev)}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="trend-chip">
                      <TrendingUp size={13} />
                      +12.5%
                    </span>
                    <span className="text-xs text-stone-500 truncate">so với hôm qua</span>
                  </div>
                </div>
              </div>

              {/* Stat Card 2 — Đơn hàng */}
              <div className="stat-tile accent-teal flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 truncate">Số đơn hàng mới</p>
                  <div className="icon-tile ml-2">
                    <ClipboardList size={16} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="stat-tile-value truncate">{stats?.totalOrders || orders.length || 0}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="trend-chip">
                      <TrendingUp size={13} />
                      +5.2%
                    </span>
                    <span className="text-xs text-stone-500 truncate">so với hôm qua</span>
                  </div>
                </div>
              </div>

              {/* Stat Card 3 — Món bán chạy */}
              <div className="stat-tile accent-caramel flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 truncate">Món ăn bán chạy nhất</p>
                  <div className="icon-tile ml-2">
                    <UtensilsCrossed size={16} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="stat-tile-value truncate" style={{ fontSize: '1.35rem' }} title={topProducts[0]?.name || 'Phở Bò'}>
                    {topProducts[0]?.name || 'Phở Bò'}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="trend-chip" style={{ color: 'var(--caramel-dark)' }}>
                      <Sparkles size={13} />
                      {topProducts[0]?.quantity || 342}
                    </span>
                    <span className="text-xs text-stone-500 truncate">lượt bán hôm nay</span>
                  </div>
                </div>
              </div>

              {/* Stat Card 4 — Khách hàng mới */}
              <div className="stat-tile accent-matcha flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 truncate">Khách hàng mới</p>
                  <div className="icon-tile ml-2">
                    <Users size={16} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="stat-tile-value truncate">{usersList.length || 120}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="trend-chip">
                      <TrendingUp size={13} />
                      +1.1%
                    </span>
                    <span className="text-xs text-stone-500 truncate">so với tuần trước</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid: Chart (2 cols) + Activities (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
              {/* Chart Section (Spans 2 columns) */}
              <div className="bento-panel lg:col-span-2 flex flex-col min-w-0">
                <div className="bento-panel-header flex flex-wrap justify-between items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-stone-700" />
                    Tăng trưởng doanh thu
                  </h3>
                  <div className="flex gap-1.5">
                    <button className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-700 rounded border border-stone-200">
                      1T
                    </button>
                    <button className="px-2.5 py-1 text-xs font-medium bg-stone-900 text-white rounded">
                      1Th
                    </button>
                    <button className="px-2.5 py-1 text-xs font-medium bg-white text-stone-600 rounded border border-stone-200 hover:bg-stone-50">
                      1N
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between bg-stone-50/30 overflow-hidden">
                  {/* Bounded Chart Area */}
                  <div className="relative w-full h-[180px] my-3 overflow-hidden rounded-xl bg-white/60 border border-stone-100 p-2">
                    {/* Grid lines */}
                    <div className="absolute inset-x-0 bottom-2 border-t border-stone-200/50"></div>
                    <div className="absolute inset-x-0 bottom-1/3 border-t border-stone-200/40 border-dashed"></div>
                    <div className="absolute inset-x-0 bottom-2/3 border-t border-stone-200/40 border-dashed"></div>

                    {/* SVG Curve & Area Fill (Clean Bounded Coordinates) */}
                    <svg className="w-full h-full block" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="gradientAreaClean" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C5C9C" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#7C5C9C" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 95 L 0 70 Q 20 60 40 45 T 70 55 T 100 25 L 100 95 Z"
                        fill="url(#gradientAreaClean)"
                      />
                      <path
                        d="M 0 70 Q 20 60 40 45 T 70 55 T 100 25"
                        fill="none"
                        stroke="#5C4174"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  {/* Channel Breakdown Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-200/60">
                    <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--caramel-light)', borderColor: 'var(--caramel-line)' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--caramel)' }}></span>
                        <span className="text-xs font-semibold text-stone-700">🏪 Tại quầy (POS)</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--caramel-dark)' }}>{formatPrice(posRev)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: 'var(--taro-light)', borderColor: 'var(--taro-line)' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--taro)' }}></span>
                        <span className="text-xs font-semibold text-stone-700">🌐 Đặt Online</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--taro-dark)' }}>{formatPrice(onlineRev)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities Section (1 column) */}
              <div className="bento-panel flex flex-col min-w-0">
                <div className="bento-panel-header flex justify-between items-center">
                  <h3 className="text-base font-bold text-stone-900">Hoạt động gần đây</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-stone-900 hover:underline"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="p-5 flex-1 max-h-[340px] overflow-y-auto">
                  <ul className="space-y-4 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-stone-200">
                    {stats?.recentOrders?.slice(0, 5).map((ord) => {
                      const badge = STATUS_BADGES[ord.orderStatus] || { label: ord.orderStatus, cls: '' };
                      const channel = getOrderChannel(ord.shippingAddress);
                      const isCompleted = ord.orderStatus === 'COMPLETED';
                      const isCancel = ord.orderStatus === 'CANCEL';
                      const dotBg = isCompleted ? 'bg-emerald-500' : isCancel ? 'bg-rose-500' : 'bg-stone-900';

                      return (
                        <li key={ord.id} className="relative pl-7 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ${dotBg} ring-4 ring-white`}></span>
                            <p className="text-xs font-semibold text-stone-900 truncate">
                              {channel.icon} Đơn <span className="font-bold">#{ord.id}</span> vừa được đặt
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`status-badge ${badge.cls}`}>{badge.label}</span>
                              <span className="text-[11px] text-stone-400 font-medium">
                                {formatTimeAgo(ord.createdAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors flex-shrink-0"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                        </li>
                      );
                    })}

                    {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                      <li className="text-center text-xs text-stone-400 py-6">Chưa có hoạt động gần đây</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Table Section - Top Selling Products */}
            <div className="bento-panel min-w-0">
              <div className="bento-panel-header flex flex-wrap justify-between items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">Món ăn bán chạy nhất</h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-3 py-1.5 text-xs font-medium border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-1"
                >
                  Lọc
                  <Plus size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80">
                      <th className="p-3.5 text-xs font-semibold text-stone-500">Tên món ăn</th>
                      <th className="p-3.5 text-xs font-semibold text-stone-500 text-right">Doanh thu</th>
                      <th className="p-3.5 text-xs font-semibold text-stone-500 text-right">Lượt bán</th>
                      <th className="p-3.5 text-xs font-semibold text-stone-500 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-stone-100">
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-stone-400 text-xs font-medium">
                          Chưa có dữ liệu bán hàng
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((p, idx) => {
                        const matchedProd = products.find((prod) => prod.name === p.name);
                        const stock = matchedProd?.stockQuantity ?? 50;
                        const isOutOfStock = stock === 0;
                        const isLowStock = stock > 0 && stock <= 10;

                        const statusLabel = isOutOfStock ? 'Hết món' : isLowStock ? 'Sắp hết' : 'Còn món';
                        const statusClass = isOutOfStock
                          ? 'stock-indicator out'
                          : isLowStock
                          ? 'stock-indicator low'
                          : 'stock-indicator ok';

                        return (
                          <tr key={p.name} className="hover:bg-stone-50/80 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-700 flex-shrink-0">
                                  #{idx + 1}
                                </div>
                                <span className="text-stone-900 font-medium truncate max-w-[220px]" title={p.name}>
                                  {p.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 text-right font-semibold text-stone-900">{formatPrice(p.revenue)}</td>
                            <td className="p-3.5 text-right text-stone-600">{p.quantity}</td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${statusClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}


      {/* ================= TAB 2: QUẢN LÝ MÓN ĂN (PRODUCTS) ================= */}
      {activeTab === 'products' && (
        <div className="tab-content animate-fade-in">
          <div className="admin-toolbar mb-5 flex flex-wrap justify-between items-center gap-3">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm món ăn theo tên hoặc danh mục..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {productSearch && (
                <button onClick={() => setProductSearch('')}><X size={14} /></button>
              )}
            </div>

            <button onClick={handleOpenAddProduct} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Thêm món mới
            </button>
          </div>

          <div className="admin-panel-box">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hình ảnh</th>
                    <th>Tên món</th>
                    <th>Danh mục</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={5} cols={6} />
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6">
                        <EmptyState
                          title="Không tìm thấy món ăn"
                          description="Chưa có món ăn nào phù hợp với bộ lọc tìm kiếm."
                          actionText="Thêm món ăn mới"
                          onAction={handleOpenAddProduct}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (

                      <tr key={prod.id}>
                        <td>
                          <div className="admin-prod-thumb">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} />
                            ) : (
                              <span>🍽️</span>
                            )}
                          </div>
                        </td>
                        <td className="font-semibold text-gray-800">{prod.name}</td>
                        <td>
                          <span className="cat-pill">{prod.category || 'Khác'}</span>
                        </td>
                        <td className="font-bold text-green-800">{formatPrice(prod.price)}</td>
                        <td>
                          <span className={`stock-indicator ${prod.stockQuantity === 0 ? 'out' : prod.stockQuantity <= 5 ? 'low' : 'ok'}`}>
                            {prod.stockQuantity} suất
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="action-icon-btn edit"
                              title="Chỉnh sửa món"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod)}
                              className="action-icon-btn delete"
                              title="Xóa món"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUẢN LÝ ĐƠN HÀNG (ORDERS) ================= */}
      {activeTab === 'orders' && (
        <div className="tab-content animate-fade-in space-y-5">
          <div className="admin-toolbar flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Trạng thái:</span>
              <button
                className={`filter-pill ${orderStatusFilter === '' ? 'active' : ''}`}
                onClick={() => setOrderStatusFilter('')}
              >
                Tất cả ({orders.length})
              </button>
              {Object.entries(STATUS_BADGES).map(([stKey, stVal]) => {
                const count = orders.filter(o => o.orderStatus === stKey).length;
                return (
                  <button
                    key={stKey}
                    className={`filter-pill ${orderStatusFilter === stKey ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter(stKey)}
                  >
                    {stVal.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Kênh đặt:</span>
              <button
                className={`filter-pill ${orderChannelFilter === '' ? 'active' : ''}`}
                onClick={() => setOrderChannelFilter('')}
              >
                Tất cả kênh
              </button>
              <button
                className={`filter-pill ${orderChannelFilter === 'pos' ? 'active' : ''}`}
                onClick={() => setOrderChannelFilter('pos')}
              >
                🏪 Tại quầy (POS)
              </button>
              <button
                className={`filter-pill ${orderChannelFilter === 'online' ? 'active' : ''}`}
                onClick={() => setOrderChannelFilter('online')}
              >
                🌐 Online
              </button>
            </div>
          </div>

          <div className="admin-panel-box">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Kênh Đặt</th>
                    <th>Thời gian</th>
                    <th>Địa chỉ / Ghi chú</th>
                    <th>Số món</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Cập nhật</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={5} cols={9} />
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6">
                        <EmptyState
                          title="Không tìm thấy đơn hàng"
                          description="Hiện không có đơn hàng nào khớp với bộ lọc của bạn."
                          actionText="Bỏ bộ lọc"
                          onAction={() => { setOrderStatusFilter(''); setOrderChannelFilter(''); }}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {

                      const badge = STATUS_BADGES[ord.orderStatus] || { label: ord.orderStatus, cls: '' };
                      const channel = getOrderChannel(ord.shippingAddress);
                      const totalItemsCount = ord.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                      const readyItemsCount = ord.items?.filter((i) => i.preparedStatus === 'READY').reduce((acc, i) => acc + i.quantity, 0) || 0;
                      const allItemsReady = totalItemsCount > 0 && readyItemsCount === totalItemsCount;

                      return (
                        <tr key={ord.id}>
                          <td className="font-bold text-gray-800">#{ord.id}</td>
                          <td>
                            <span className={`channel-badge ${channel.cls}`}>
                              {channel.icon} {channel.label}
                            </span>
                          </td>
                          <td className="text-xs text-gray-500">
                            {new Date(ord.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="text-xs max-w-xs truncate" title={ord.shippingAddress}>
                            {ord.shippingAddress || '—'}
                          </td>
                          <td className="text-center font-medium">
                            <div>{totalItemsCount} món</div>
                            {totalItemsCount > 0 && (
                              <span
                                className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded-full ${
                                  allItemsReady
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : readyItemsCount > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {allItemsReady
                                  ? `✓ ${readyItemsCount}/${totalItemsCount} đã pha`
                                  : `⏳ ${readyItemsCount}/${totalItemsCount} đã pha`}
                              </span>
                            )}
                          </td>
                          <td className="font-bold text-green-800">{formatPrice(ord.totalPrice)}</td>


                          <td>
                            <span className={`status-badge ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td>
                            <select
                              className="status-select"
                              value={ord.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              disabled={ord.orderStatus === 'COMPLETED' || ord.orderStatus === 'CANCEL'}
                            >
                              <option value="NEW">Đơn mới</option>
                              <option value="PROCESSING">Đang chuẩn bị</option>
                              <option value="SHIPPING">Đang giao</option>
                              <option value="COMPLETED">Hoàn thành</option>
                              <option value="CANCEL">Đã hủy</option>
                            </select>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="action-icon-btn"
                              title="Xem thông tin chi tiết đơn hàng"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: QUẢN LÝ THÀNH VIÊN (USERS) ================= */}
      {activeTab === 'users' && (
        <div className="tab-content animate-fade-in">
          <div className="admin-toolbar mb-5 flex justify-between items-center">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm thành viên theo email hoặc tên..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {userSearch && (
                <button onClick={() => setUserSearch('')}><X size={14} /></button>
              )}
            </div>
          </div>

          <div className="admin-panel-box">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Họ và Tên</th>
                    <th>Số điện thoại</th>
                    <th>Ngày tham gia</th>
                    <th>Vai trò (Role)</th>
                    <th>Phân quyền</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        Không tìm thấy thành viên nào
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const fullName = ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || 'Chưa cập nhật';
                      const isAdmin = u.role === 'ADMIN';
                      return (
                        <tr key={u.id}>
                          <td className="font-bold text-gray-600">#{u.id}</td>
                          <td className="font-semibold text-gray-800">{u.email}</td>
                          <td>{fullName}</td>
                          <td>{u.phone || '—'}</td>
                          <td className="text-xs text-gray-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td>
                            <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
                              {isAdmin ? '🛡️ ADMIN' : '👤 USER'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleUserRole(u)}
                              className={`role-toggle-btn ${isAdmin ? 'demote' : 'promote'}`}
                            >
                              {isAdmin ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                              {isAdmin ? 'Hạ xuống USER' : 'Nâng lên ADMIN'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT MODAL (ADD / EDIT) ================= */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? '✏️ Chỉnh sửa món ăn' : '➕ Thêm món ăn mới'}</h3>
              <button onClick={() => setShowProductModal(false)} className="close-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-body space-y-4">
              <div>
                <label className="input-label">Tên món ăn <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Trà Sữa Matcha Trân Châu"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Danh mục</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ví dụ: Trà Sữa, Đồ Ăn Vặt"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Giá bán (VND) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="25000"
                    min="0"
                    step="1000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Số lượng tồn kho</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="50"
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Đường dẫn hình ảnh (URL)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://..."
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Mô tả chi tiết món ăn</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Thành phần, vị trà, lượng đường đá..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="btn-primary"
                >
                  {submittingProduct ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : editingProduct ? (
                    <>
                      <CheckCircle2 size={16} />
                      Lưu thay đổi
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Thêm món
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 5: KHO & NGUYÊN LIỆU ================= */}
      {activeTab === 'inventory' && (
        <div className="tab-content animate-fade-in">
          <InventoryManagement />
        </div>
      )}


      {/* ================= ORDER DETAIL MODAL ================= */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Chi tiết đơn hàng #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="close-btn"><X size={18} /></button>
            </div>

            <div className="modal-body space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-200 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Kênh đặt hàng:</span>
                  <span className={`channel-badge ${getOrderChannel(selectedOrder.shippingAddress).cls}`}>
                    {getOrderChannel(selectedOrder.shippingAddress).icon} {getOrderChannel(selectedOrder.shippingAddress).label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Thời gian tạo:</span>
                  <span className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`status-badge ${STATUS_BADGES[selectedOrder.orderStatus]?.cls}`}>
                    {STATUS_BADGES[selectedOrder.orderStatus]?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Địa chỉ / Ghi chú:</span>
                  <span className="font-semibold text-right max-w-xs">{selectedOrder.shippingAddress || 'Chưa cung cấp'}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">Danh sách món đã đặt:</h4>
                  {selectedOrder.items && (
                    <span className="text-xs font-semibold text-gray-500">
                      Tiến độ pha chế: {selectedOrder.items.filter((i) => i.preparedStatus === 'READY').reduce((acc, i) => acc + i.quantity, 0)}/
                      {selectedOrder.items.reduce((acc, i) => acc + i.quantity, 0)} ly đã pha
                    </span>
                  )}

                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <span>🧋</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-800">{item.productName}</p>
                            {item.preparedStatus === 'READY' ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                                ✓ Đã pha
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
                                ⏳ Chờ pha
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{formatPrice(item.price)} × {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-800 text-sm">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>


              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-700">Tổng cộng thanh toán:</span>
                <span className="font-black text-xl text-green-800">{formatPrice(selectedOrder.totalPrice)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;