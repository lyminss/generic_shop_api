import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Coffee,
  History,
  ChefHat,
} from 'lucide-react';
import './SidebarLayout.css';

const baristaNavItems = [
  {
    group: 'Quầy Pha Chế',
    items: [
      { icon: <ChefHat size={18} />, label: 'Bảng Kẹp Đơn (KDS)', to: '/barista', end: true },
      { icon: <History size={18} />, label: 'Lịch sử Pha Chế', to: '/barista/history' },
    ],
  },
];

const BaristaLayout = ({ pendingCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <div className="sidebar-brand-title">Túc Tắc Tea</div>
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
          {baristaNavItems.map((group) => (
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
                  {item.label.includes('KDS') && pendingCount > 0 && (
                    <span className="sidebar-badge">{pendingCount}</span>
                  )}
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
          <span className="sidebar-topbar-title">Màn hình Pha Chế Quầy Bar (KDS)</span>
          <div className="sidebar-topbar-right">
            <Coffee size={14} />
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

export default BaristaLayout;
