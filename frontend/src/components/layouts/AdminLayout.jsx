import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import './SidebarLayout.css';

const adminNavItems = [
  {
    group: 'Tổng quan',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Dashboard', to: '/admin', end: true },
      { icon: <BarChart3 size={18} />, label: 'Thống kê doanh thu', to: '/admin/stats' },
    ],
  },
  {
    group: 'Quản lý',
    items: [
      { icon: <UtensilsCrossed size={18} />, label: 'Quản lý Món ăn', to: '/admin/products' },
      { icon: <ClipboardList size={18} />, label: 'Quản lý Đơn hàng', to: '/admin/orders' },
      { icon: <Users size={18} />, label: 'Quản lý Thành viên', to: '/admin/users' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [
      { icon: <Settings size={18} />, label: 'Cài đặt', to: '/admin/settings' },
    ],
  },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className={`sidebar-layout${collapsed ? ' collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar sidebar--admin${collapsed ? ' collapsed' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">⚙️</span>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">Túc Tắc Tea</div>
            <div className="sidebar-brand-subtitle">Admin Panel</div>
          </div>
          {/* Toggle — absolute positioned on right edge via CSS */}
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
          {adminNavItems.map((group) => (
            <div key={group.group}>
              <div className="sidebar-group-label">{group.group}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? ' active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.badge ? (
                    <span className="sidebar-badge">{item.badge}</span>
                  ) : null}
                </NavLink>
              ))}
              <div className="sidebar-divider" />
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName || user?.email}</div>
              <div className="sidebar-user-role">Quản trị viên</div>
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
          <span className="sidebar-topbar-title">Hệ thống Quản trị</span>
          <div className="sidebar-topbar-right">
            <span>👤 {user?.email}</span>
          </div>
        </header>
        <main className="sidebar-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
