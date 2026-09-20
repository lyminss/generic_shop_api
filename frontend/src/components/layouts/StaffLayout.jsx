import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/api';
import { playOrderNotificationSound, testNotificationSound } from '../../utils/audio';
import NewOrderNotification from '../staff/NewOrderNotification';
import {
  ChevronLeft, ChevronRight,
  LogOut, Store, BellRing, ClipboardList,
  Volume2, VolumeX, Sparkles
} from 'lucide-react';
import './SidebarLayout.css';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('staff_notification_sound_enabled') !== 'false';
  });

  // Orders tracking
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const knownOrderIdsRef = useRef(new Set());
  const isFirstFetchRef = useRef(true);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem('staff_notification_sound_enabled', nextState.toString());
    if (nextState) {
      testNotificationSound();
      toast.info('🔊 Đã bật âm thanh thông báo đơn mới');
    } else {
      toast.info('🔇 Đã tắt âm thanh thông báo');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Đã đăng xuất thành công');
    navigate('/login', { replace: true });
  };

  // Check for new orders
  const checkNewOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await orderService.getAllOrders();
      const allOrders = res.data || [];
      
      const newOrders = allOrders.filter(o => o.orderStatus === 'NEW');
      setNewOrdersCount(newOrders.length);

      // On initial load, record all existing order IDs without ringing
      if (isFirstFetchRef.current) {
        allOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
        isFirstFetchRef.current = false;
        return;
      }

      // Check if there are newly arrived 'NEW' orders
      const incomingNewOrders = newOrders.filter(o => !knownOrderIdsRef.current.has(o.id));

      if (incomingNewOrders.length > 0) {
        // Register newly seen orders
        incomingNewOrders.forEach(o => knownOrderIdsRef.current.add(o.id));

        // Add to active floating alerts (limit to latest 3 cards)
        setActiveAlerts(prev => {
          const combined = [...incomingNewOrders, ...prev];
          return combined.slice(0, 3);
        });

        // Trigger sound chime
        playOrderNotificationSound();
      }

      // Keep known IDs set up-to-date
      allOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
    } catch (err) {
      console.warn('Lỗi khi kiểm tra đơn hàng mới:', err);
    }
  }, []);

  useEffect(() => {
    // StaffDashboard already polls at all /staff/* routes — skip duplicate polling there
    const onStaffPage = location.pathname.startsWith('/staff');
    checkNewOrders();
    if (onStaffPage) return; // Dashboard handles its own fetch loop
    const interval = setInterval(checkNewOrders, 3500);
    return () => clearInterval(interval);
  }, [checkNewOrders, location.pathname]);

  // Quick action from popup notification
  const handleConfirmOrderFromAlert = async (orderId) => {
    try {
      await orderService.updateOrderStatus(orderId, 'PROCESSING');
      toast.success(`🎉 Đã xác nhận đơn #${orderId} — chuyển cho Barista!`);
      // Remove from alert list
      setActiveAlerts(prev => prev.filter(o => o.id !== orderId));
      checkNewOrders();
    } catch {
      toast.error('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const handleViewOrderFromAlert = (orderId) => {
    setActiveAlerts(prev => prev.filter(o => o.id !== orderId));
    navigate('/staff/new-orders');
  };

  const handleDismissAlert = (orderId) => {
    setActiveAlerts(prev => prev.filter(o => o.id !== orderId));
  };

  const initials = (user?.firstName || user?.email || 'S').charAt(0).toUpperCase();

  return (
    <div className={`sidebar-layout${collapsed ? ' collapsed' : ''}`}>
      {/* Floating Eye-Catching New Order Notification Popup */}
      <NewOrderNotification
        newOrders={activeAlerts}
        onConfirm={handleConfirmOrderFromAlert}
        onViewOrder={handleViewOrderFromAlert}
        onDismiss={handleDismissAlert}
      />

      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar sidebar--staff${collapsed ? ' collapsed' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">💁</span>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">MinTea</div>
            <div className="sidebar-brand-subtitle">Staff · Thu ngân</div>
          </div>
          {/* Toggle — positioned absolute on right edge */}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-group-label">Quầy Thu Ngân</div>
          <NavLink
            to="/staff"
            end
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? 'POS Gọi Món' : undefined}
          >
            <span className="sidebar-nav-icon"><Store size={17} /></span>
            <span className="sidebar-nav-label">POS Gọi Món</span>
          </NavLink>

          <div className="sidebar-divider" />
          <div className="sidebar-group-label">Đơn Hàng</div>

          <NavLink
            to="/staff/new-orders"
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? 'Đơn Mới Cần Duyệt' : undefined}
          >
            <span className="sidebar-nav-icon"><BellRing size={17} /></span>
            <span className="sidebar-nav-label">Đơn Mới Cần Duyệt</span>
            {newOrdersCount > 0 && (
              <span className="sidebar-badge pulse" title={`${newOrdersCount} đơn mới đang chờ duyệt`}>
                {newOrdersCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/staff/all-orders"
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? 'Tất Cả Đơn Hàng' : undefined}
          >
            <span className="sidebar-nav-icon"><ClipboardList size={17} /></span>
            <span className="sidebar-nav-label">Tất Cả Đơn Hàng</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName || user?.email}</div>
              <div className="sidebar-user-role">Nhân viên phục vụ</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            <span className="sidebar-logout-label">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="sidebar-main">
        <header className="sidebar-topbar">
          <div className="flex items-center gap-2">
            <span className="sidebar-topbar-title">🧋 MinTea — Màn hình Phục vụ & Thu ngân</span>
            {newOrdersCount > 0 && (
              <span style={{
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                {newOrdersCount} đơn chờ duyệt
              </span>
            )}
          </div>

          <div className="sidebar-topbar-right">
            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              className={`topbar-sound-btn ${soundEnabled ? 'active' : 'muted'}`}
              title={soundEnabled ? 'Chuông báo đang BẬT. Bấm để tắt.' : 'Chuông báo đang TẮT. Bấm để bật.'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{soundEnabled ? 'Chuông: BẬT' : 'Chuông: TẮT'}</span>
            </button>

            <button
              onClick={testNotificationSound}
              className="topbar-test-sound"
              title="Thử âm thanh chuông báo"
            >
              Thử chuông
            </button>

            <span style={{ color: '#cbd5e1' }}>|</span>

            <span>👤 {user?.firstName || user?.email}</span>
          </div>
        </header>
        <main className="sidebar-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;

