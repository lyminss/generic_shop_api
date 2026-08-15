import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, LogOut, User, UtensilsCrossed, Home, ClipboardList, Menu, X, Shield, Coffee, ConciergeBell } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="navbar-container glass-header" aria-label="Main Navigation">
      <div className="container nav-content">
        {/* Brand Logo */}
        <Link to="/" className="nav-brand" onClick={closeMenu} aria-label="Túc Tắc Tea Home">
          <div className="brand-logo-icon">🧋</div>
          <div className="brand-text-wrapper">
            <span className="brand-title">Túc Tắc Tea</span>
            <span className="brand-tagline">Artisanal Brews</span>
          </div>
        </Link>

        {/* Desktop & Mobile Navigation Links */}
        <div className={`nav-menu ${mobileOpen ? 'is-open' : ''}`}>
          <div className="nav-group">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Home size={17} /> <span>Trang chủ</span>
            </NavLink>
            
            <NavLink
              to="/menu"
              onClick={closeMenu}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <UtensilsCrossed size={17} /> <span>Thực đơn</span>
            </NavLink>

            {user && (
              <NavLink
                to="/orders"
                onClick={closeMenu}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <ClipboardList size={17} /> <span>Đơn hàng của tôi</span>
              </NavLink>
            )}
          </div>

          {/* Role Based Access Fast Links */}
          <div className="role-links-group">
            {user?.role === 'STAFF' && (
              <NavLink
                to="/staff"
                onClick={closeMenu}
                className={({ isActive }) => `role-badge-link staff-badge ${isActive ? 'active' : ''}`}
              >
                <ConciergeBell size={16} /> <span>POS Phục Vụ</span>
              </NavLink>
            )}

            {user?.role === 'BARISTA' && (
              <NavLink
                to="/barista"
                onClick={closeMenu}
                className={({ isActive }) => `role-badge-link barista-badge ${isActive ? 'active' : ''}`}
              >
                <Coffee size={16} /> <span>KDS Quầy Bar</span>
              </NavLink>
            )}

            {user?.role === 'ADMIN' && (
              <NavLink
                to="/admin"
                onClick={closeMenu}
                className={({ isActive }) => `role-badge-link admin-badge ${isActive ? 'active' : ''}`}
              >
                <Shield size={16} /> <span>Quản Trị viên</span>
              </NavLink>
            )}
          </div>

          {/* Right Action Icons & User Account */}
          <div className="nav-actions">
            {user ? (
              <>
                <Link 
                  to="/cart" 
                  onClick={closeMenu}
                  className="cart-action-btn" 
                  aria-label={`Giỏ hàng có ${totalItems} sản phẩm`}
                >
                  <ShoppingCart size={20} />
                  {totalItems > 0 && <span className="cart-badge-count">{totalItems}</span>}
                </Link>

                <div className="user-profile-pill">
                  <Link to="/profile?tab=info" onClick={closeMenu} className="profile-link">
                    <div className="avatar-placeholder">
                      <User size={15} />
                    </div>
                    <span className="user-display-name">{user.firstName || user.email.split('@')[0]}</span>
                  </Link>
                  
                  <button 
                    onClick={handleLogout} 
                    className="logout-action-btn" 
                    title="Đăng xuất" 
                    aria-label="Đăng xuất"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-action-group">
                <Link to="/login" onClick={closeMenu} className="btn-outline text-sm">
                  Đăng nhập
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn-brand text-sm">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-hamburger" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

