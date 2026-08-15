import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// ---- Shared & Auth ----
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import RootRoute from './components/RootRoute';

// ---- Layouts ----
import AdminLayout from './components/layouts/AdminLayout';
import StaffLayout from './components/layouts/StaffLayout';
import BaristaLayout from './components/layouts/BaristaLayout';

// ---- Customer Pages ----
import Home from './pages/user/Home';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import Cart from './pages/user/Cart';
import Orders from './pages/user/Orders';
import OrderDetail from './pages/user/OrderDetail';
import Profile from './pages/user/Profile';
import ProductDetail from './pages/user/ProductDetail';
import NotFound from './pages/user/NotFound';

// ---- Admin Pages ----
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStats from './pages/admin/AdminStats';

// ---- Staff Pages ----
import StaffDashboard from './pages/staff/StaffDashboard';

// ---- Barista Pages ----
import BaristaKDS from './pages/barista/BaristaKDS';

// UserLayout: the existing Navbar + content
const UserLayout = () => (
  <>
    <Navbar />
    <main className="app-main">
      <Routes>
        {/* Root: smart redirect by role or show landing */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/menu" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  </>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* ============ ADMIN LAYOUT ============ */}
              <Route
                path="/admin/*"
                element={
                  <RoleBasedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout />
                  </RoleBasedRoute>
                }
              >
                {/* /admin → Dashboard */}
                <Route index element={<AdminDashboard />} />
                <Route path="stats" element={<AdminStats />} />
                {/* sub-pages: /admin/products, /admin/orders, etc */}
                <Route path="*" element={<AdminDashboard />} />
              </Route>

              {/* ============ STAFF LAYOUT ============ */}
              <Route
                path="/staff/*"
                element={
                  <RoleBasedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffLayout />
                  </RoleBasedRoute>
                }
              >
                {/* /staff → POS dashboard (detects tab from URL) */}
                <Route index element={<StaffDashboard />} />
                <Route path="new-orders" element={<StaffDashboard />} />
                <Route path="all-orders" element={<StaffDashboard />} />
                <Route path="*" element={<StaffDashboard />} />
              </Route>

              {/* ============ BARISTA LAYOUT ============ */}
              <Route
                path="/barista/*"
                element={
                  <RoleBasedRoute allowedRoles={['BARISTA', 'STAFF', 'ADMIN']}>
                    <BaristaLayout />
                  </RoleBasedRoute>
                }
              >
                {/* /barista → KDS (detects tab from URL) */}
                <Route index element={<BaristaKDS />} />
                <Route path="history" element={<BaristaKDS />} />
                <Route path="*" element={<BaristaKDS />} />
              </Route>

              {/* ============ USER / CUSTOMER LAYOUT ============ */}
              <Route path="/*" element={<UserLayout />} />
            </Routes>
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
