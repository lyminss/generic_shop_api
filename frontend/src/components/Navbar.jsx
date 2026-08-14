import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, LogOut, User, UtensilsCrossed, Home } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <nav className="navbar glass-panel" aria-label="Điều hướng chính">
      <div className="container nav-content">
        {/* Brand */}
        <Link to="/" className="nav-brand" aria-label="Trang chủ Túc Tắc Tea">
          <span className="brand-text">🧋 Túc Tắc Tea</span>
        </Link>

        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Home size={15} /> Trang chủ
          </NavLink>
          <NavLink
            to="/menu"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <UtensilsCrossed size={15} /> Thực đơn
          </NavLink>

          {user?.role === 'STAFF' && (
            <NavLink
              to="/staff"
              className={({ isActive }) => `nav-link staff-nav-link ${isActive ? 'active' : ''}`}
            >
              💁 Phục Vụ (POS)
            </NavLink>
          )}

          {user?.role === 'BARISTA' && (
            <NavLink
              to="/barista"
              className={({ isActive }) => `nav-link barista-nav-link ${isActive ? 'active' : ''}`}
            >
              ☕ Quầy Bar (KDS)
            </NavLink>
          )}

          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link admin-nav-link ${isActive ? 'active' : ''}`}
            >
              ⚙️ Quản trị
            </NavLink>
          )}

          {user ? (
            <>
              <Link to="/cart" className="nav-link cart-link" aria-label={`Giỏ hàng: ${totalItems} sản phẩm`}>
                <ShoppingCart size={20} />
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
              <div className="user-menu">
                <Link to="/profile?tab=info" className="user-name">
                  <User size={16} /> {user.firstName || user.email}
                </Link>
                <button onClick={handleLogout} className="logout-btn" title="Đăng xuất" aria-label="Đăng xuất">
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">Đăng nhập</Link>
              <Link to="/register" className="btn-primary">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
