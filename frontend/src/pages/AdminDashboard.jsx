import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminService, productService, orderService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import {
  LayoutDashboard,
  UtensilsCrossed,
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
} from 'lucide-react';
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

  // Initial Load
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

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
    if (!productForm.name || !productForm.price) {
      toast.error('Vui lòng điền tên món và giá tiền');
      return;
    }

    setSubmittingProduct(true);
    const payload = {
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      price: Number(productForm.price),
      stockQuantity: Number(productForm.stockQuantity || 0),
      image: productForm.image.trim(),
      description: productForm.description.trim(),
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
    <div className="admin-container animate-fade-in">
      {/* Admin Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">⚙️ Trang Quản Trị Túc Tắc Tea</h1>
          <p className="admin-subtitle">Quản lý món ăn, đơn hàng, thành viên và theo dõi hoạt động kinh doanh</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => handleTabChange('stats', '/admin')}
        >
          <LayoutDashboard size={18} /> Tổng quan
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => handleTabChange('products', '/admin/products')}
        >
          <UtensilsCrossed size={18} /> Quản lý Món ăn ({products.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleTabChange('orders', '/admin/orders')}
        >
          <ClipboardList size={18} /> Quản lý Đơn hàng ({orders.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users', '/admin/users')}
        >
          <Users size={18} /> Quản lý Thành viên ({usersList.length})
        </button>
      </div>

      {/* ================= TAB 1: TỔNG QUAN (STATS) ================= */}
      {activeTab === 'stats' && (
        <div className="tab-content animate-fade-in">
          {/* Stats Metric Cards */}
          <div className="stats-cards-grid">
            <div className="stat-card primary-card">
              <div className="stat-card-header">
                <span>Tổng Doanh Thu</span>
                <TrendingUp size={22} />
              </div>
              <div className="stat-card-value">
                {formatPrice(stats?.totalRevenue || 0)}
              </div>
              <div className="stat-card-sub">Chỉ tính đơn đã hoàn thành</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Tổng Đơn Hàng</span>
                <ClipboardList size={22} className="text-emerald-600" />
              </div>
              <div className="stat-card-value">{stats?.totalOrders || 0}</div>
              <div className="stat-card-sub">
                <span className="text-blue-600 font-semibold">{stats?.newOrdersCount || 0} mới</span> •{' '}
                <span className="text-amber-600 font-semibold">{stats?.processingOrdersCount || 0} đang làm</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Số Món Trong Menu</span>
                <UtensilsCrossed size={22} className="text-amber-600" />
              </div>
              <div className="stat-card-value">{stats?.totalProducts || 0}</div>
              <div className="stat-card-sub">Món ăn & Đồ uống đang phục vụ</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Khách Hàng Đăng Ký</span>
                <Users size={22} className="text-indigo-600" />
              </div>
              <div className="stat-card-value">{stats?.totalUsers || 0}</div>
              <div className="stat-card-sub">Tài khoản thành viên hệ thống</div>
            </div>
          </div>

          {/* Status Breakdown Bar */}
          <div className="admin-panel-box mt-6">
            <h3 className="panel-title mb-4">📊 Tỷ lệ trạng thái đơn hàng</h3>
            <div className="status-progress-bar">
              {stats?.totalOrders > 0 ? (
                <>
                  <div
                    style={{ width: `${(stats.newOrdersCount / stats.totalOrders) * 100}%` }}
                    className="bar-segment bg-blue-500"
                    title={`Đơn mới: ${stats.newOrdersCount}`}
                  />
                  <div
                    style={{ width: `${(stats.processingOrdersCount / stats.totalOrders) * 100}%` }}
                    className="bar-segment bg-amber-500"
                    title={`Đang làm: ${stats.processingOrdersCount}`}
                  />
                  <div
                    style={{ width: `${(stats.shippingOrdersCount / stats.totalOrders) * 100}%` }}
                    className="bar-segment bg-indigo-500"
                    title={`Đang giao: ${stats.shippingOrdersCount}`}
                  />
                  <div
                    style={{ width: `${(stats.completedOrdersCount / stats.totalOrders) * 100}%` }}
                    className="bar-segment bg-emerald-500"
                    title={`Hoàn thành: ${stats.completedOrdersCount}`}
                  />
                  <div
                    style={{ width: `${(stats.cancelledOrdersCount / stats.totalOrders) * 100}%` }}
                    className="bar-segment bg-rose-500"
                    title={`Đã hủy: ${stats.cancelledOrdersCount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-gray-200 h-4 rounded-full" />
              )}
            </div>
            <div className="status-legend flex flex-wrap gap-4 mt-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Đơn mới ({stats?.newOrdersCount || 0})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Đang chuẩn bị ({stats?.processingOrdersCount || 0})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Đang giao ({stats?.shippingOrdersCount || 0})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Hoàn thành ({stats?.completedOrdersCount || 0})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Đã hủy ({stats?.cancelledOrdersCount || 0})</span>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="admin-panel-box mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="panel-title">⏱️ Đơn hàng gần đây</h3>
              <button onClick={() => setActiveTab('orders')} className="text-sm text-green-700 font-semibold hover:underline">
                Xem tất cả đơn hàng &rarr;
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Kênh đặt</th>
                    <th>Thời gian</th>
                    <th>Địa chỉ giao</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentOrders?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400">Chưa có đơn hàng nào</td>
                    </tr>
                  ) : (
                    stats?.recentOrders?.map((ord) => {
                      const badge = STATUS_BADGES[ord.orderStatus] || { label: ord.orderStatus, cls: '' };
                      const channel = getOrderChannel(ord.shippingAddress);
                      return (
                        <tr key={ord.id}>
                          <td className="font-bold">#{ord.id}</td>
                          <td>
                            <span className={`channel-badge ${channel.cls}`}>
                              {channel.icon} {channel.label}
                            </span>
                          </td>
                          <td className="text-xs text-gray-500">
                            {new Date(ord.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="text-xs max-w-xs truncate">{ord.shippingAddress || '—'}</td>
                          <td className="font-bold text-green-800">{formatPrice(ord.totalPrice)}</td>
                          <td>
                            <span className={`status-badge ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="action-icon-btn"
                              title="Xem chi tiết"
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

      {/* ================= TAB 2: QUẢN LÝ MÓN ĂN (PRODUCTS) ================= */}
      {activeTab === 'products' && (
        <div className="tab-content animate-fade-in">
          <div className="admin-toolbar mb-4 flex flex-wrap justify-between items-center gap-3">
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
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        Không tìm thấy món ăn nào
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
        <div className="tab-content animate-fade-in space-y-4">
          <div className="admin-toolbar flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-emerald-100 mb-4">
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
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-400">
                        Không tìm thấy đơn hàng nào
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const badge = STATUS_BADGES[ord.orderStatus] || { label: ord.orderStatus, cls: '' };
                      const channel = getOrderChannel(ord.shippingAddress);
                      const totalItemsCount = ord.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
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
                          <td className="text-center font-medium">{totalItemsCount}</td>
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
          <div className="admin-toolbar mb-4 flex justify-between items-center">
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
                  {submittingProduct ? 'Đang lưu...' : editingProduct ? 'Cập nhật món' : 'Lưu món mới'}
                </button>
              </div>
            </form>
          </div>
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
                <h4 className="font-bold text-gray-800 mb-2">Danh sách món đã đặt:</h4>
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
                          <p className="font-semibold text-sm text-gray-800">{item.productName}</p>
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
