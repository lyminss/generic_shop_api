import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminService, productService, orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Modular Feature Components
import AdminOverview from './AdminOverview';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import InventoryManagement from './InventoryManagement';
import AdminProductModal from './components/AdminProductModal';
import './AdminDashboard.css';

const getTabFromPath = (pathname) => {
  if (pathname.includes('/products')) return 'products';
  if (pathname.includes('/inventory')) return 'inventory';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/users')) return 'users';
  return 'dashboard';
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const toast = useToast();

  // Data States
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Quick Add from Overview
  const [showProductModal, setShowProductModal] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Load all initial data
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

  // Realtime background order poller
  const fetchOrdersRealtime = useCallback(async () => {
    try {
      const ordersRes = await orderService.getAllOrders();
      if (ordersRes.data) {
        setOrders(ordersRes.data);
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

  // ================== Product Handlers ==================
  const handleSaveProduct = async (formData, editingId) => {
    setSubmittingProduct(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category || 'Trà Sữa',
        price: Number(formData.price),
        stockQuantity: formData.stockQuantity === '' ? 100 : Number(formData.stockQuantity),
        image: formData.image,
        description: formData.description,
      };

      if (editingId) {
        await productService.update(editingId, payload);
        toast.success(`Đã cập nhật món "${payload.name}"`);
      } else {
        await productService.create(payload);
        toast.success(`Đã thêm món mới "${payload.name}"`);
      }

      // Reload data
      const prodRes = await productService.getAll();
      setProducts(prodRes.data || []);
      return true;
    } catch (err) {
      toast.error(err.response?.data || 'Không thể lưu thông tin món ăn');
      return false;
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productService.delete(productId);
      toast.success('Đã xóa món ăn thành công');
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      toast.error(err.response?.data || 'Không thể xóa món ăn');
    }
  };

  // ================== Order Handlers ==================
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Đã cập nhật đơn #${orderId} → ${newStatus}`);
      fetchOrdersRealtime();
    } catch (err) {
      const errMsg = typeof err.response?.data === 'string' ? err.response.data : 'Không thể cập nhật trạng thái đơn hàng';
      toast.error(errMsg);
    }
  };

  // ================== User Handlers ==================
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

  if (loading && !products.length && !orders.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium text-sm">Đang tải dữ liệu quản trị Túc Tắc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper">
      {/* Tab 1: Overview */}

      {(activeTab === 'dashboard' || activeTab === 'stats') && (
        <AdminOverview
          stats={stats}
          orders={orders}
          usersList={usersList}
          onOpenAddProduct={() => setShowProductModal(true)}
        />
      )}

      {/* Tab 2: Products */}
      {activeTab === 'products' && (
        <AdminProducts
          products={products}
          loading={loading}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          submittingProduct={submittingProduct}
        />
      )}

      {/* Tab 3: Orders */}
      {activeTab === 'orders' && (
        <AdminOrders
          orders={orders}
          loading={loading}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {/* Tab 4: Users */}
      {activeTab === 'users' && (
        <AdminUsers
          usersList={usersList}
          loading={loading}
          onToggleUserRole={handleToggleUserRole}
        />
      )}

      {/* Tab 5: Inventory & Recipes */}
      {activeTab === 'inventory' && (
        <div className="animate-fade-in">
          <InventoryManagement />
        </div>
      )}

      {/* Quick Add Product Modal from Overview */}
      <AdminProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSave={async (formData) => {
          const success = await handleSaveProduct(formData, null);
          if (success) setShowProductModal(false);
        }}
        editingProduct={null}
        submitting={submittingProduct}
      />
    </div>
  );
};

export default AdminDashboard;
