import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/api';
import { playOrderNotificationSound, testNotificationSound } from '../../utils/audio';
import NewTicketNotification from '../barista/NewTicketNotification';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Coffee,
  History,
  ChefHat,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import './SidebarLayout.css';

const BaristaLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('barista_notification_sound_enabled') !== 'false';
  });

  const [activeTicketCount, setActiveTicketCount] = useState(0);
  const [popTickets, setPopTickets] = useState([]);
  const knownProcessingTicketIdsRef = useRef(new Set());
  const isFirstFetchRef = useRef(true);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem('barista_notification_sound_enabled', nextState.toString());
    if (nextState) {
      testNotificationSound('barista');
      toast.info('🔊 Đã bật âm thanh chuông báo KDS');
    } else {
      toast.info('🔇 Đã tắt âm thanh chuông báo');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Đã đăng xuất thành công');
    navigate('/login', { replace: true });
  };

  // Poll active orders for KDS
  const checkActiveTickets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await orderService.getAllOrders();
      const allOrders = res.data || [];

      const processingOrders = allOrders.filter(
        (o) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'SHIPPING'
      );
      setActiveTicketCount(processingOrders.length);

      // On initial load, record only existing PROCESSING orders
      if (isFirstFetchRef.current) {
        allOrders
          .filter((o) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'SHIPPING')
          .forEach((o) => knownProcessingTicketIdsRef.current.add(o.id));
        isFirstFetchRef.current = false;
        return;
      }

      // Check for incoming newly transitioned processing tickets
      const newProcessingOrders = allOrders.filter(
        (o) => o.orderStatus === 'PROCESSING' && !knownProcessingTicketIdsRef.current.has(o.id)
      );

      if (newProcessingOrders.length > 0) {
        newProcessingOrders.forEach((o) => knownProcessingTicketIdsRef.current.add(o.id));
        setPopTickets((prev) => [...newProcessingOrders, ...prev]);
        // Play energetic barista notification chime
        playBaristaNotificationSound();
        toast.info(`🛎️ Có ${newProcessingOrders.length} vé pha chế mới vừa được chuyển xuống!`);
      }
    } catch (err) {
      console.warn('Lỗi khi kiểm tra vé pha chế:', err);
    }
  }, [toast]);

  useEffect(() => {
    checkActiveTickets();
    const interval = setInterval(checkActiveTickets, 3000);
    return () => clearInterval(interval);
  }, [checkActiveTickets]);

  const initials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'B';

  return (
    <div className={`sidebar-layout${collapsed ? ' collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar sidebar--barista${collapsed ? ' collapsed' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">☕</span>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">MinTea</div>
            <div className="sidebar-brand-subtitle">Barista · Quầy Bar</div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-group-label">Quầy Pha Chế</div>
          <NavLink
            to="/barista"
            end
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            title={collapsed ? 'Bảng Kẹp Đơn (KDS)' : undefined}
          >
            <span className="sidebar-nav-icon"><ChefHat size={18} /></span>
            <span className="sidebar-nav-label">Bảng Kẹp Đơn (KDS)</span>
            {activeTicketCount > 0 && (
              <span className="sidebar-badge pulse" title={`${activeTicketCount} vé đang chờ`}>
                {activeTicketCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/barista/history"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            title={collapsed ? 'Lịch sử Pha Chế' : undefined}
          >
            <span className="sidebar-nav-icon"><History size={18} /></span>
            <span className="sidebar-nav-label">Lịch sử Pha Chế</span>
          </NavLink>

          <div className="sidebar-divider" />
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName || user?.email}</div>
              <div className="sidebar-user-role">Barista · Pha chế</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={15} />
            <span className="sidebar-logout-label">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="sidebar-main">
        <header className="sidebar-topbar">
          <div className="flex items-center gap-2">
            <span className="sidebar-topbar-title">🧋 MinTea — Màn hình Pha Chế (Barista KDS)</span>
            {activeTicketCount > 0 && (
              <span style={{
                background: '#ffedd5',
                color: '#c2410c',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Flame size={12} className="text-orange-600" />
                {activeTicketCount} vé đang xử lý
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

      {/* Pop-up notification card for incoming barista tickets */}
      <NewTicketNotification
        newTickets={popTickets}
        onDismiss={(id) => setPopTickets((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
};

export default BaristaLayout;

