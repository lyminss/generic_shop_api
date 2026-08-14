import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft, ChevronRight,
  LogOut, Store, BellRing, ClipboardList,
} from 'lucide-react';
import './SidebarLayout.css';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = (user?.firstName || user?.email || 'S').charAt(0).toUpperCase();

  return (
    <div className={`sidebar-layout${collapsed ? ' collapsed' : ''}`}>
      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar sidebar--staff${collapsed ? ' collapsed' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">💁</span>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">Túc Tắc Tea</div>
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
          <span className="sidebar-topbar-title">🧋 Túc Tắc Tea — Màn hình Phục vụ & Thu ngân</span>
          <div className="sidebar-topbar-right">
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
