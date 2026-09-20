import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user, loading, isLoggingOut } = useAuth();
  const toast = useToast();

  useEffect(() => {
    // Only toast if user IS logged in but lacks permission.
    // If not logged in or during logout, silently navigate to login.
    if (!loading && !isLoggingOut && user && !allowedRoles.includes(user.role)) {
      toast.error('Bạn không có quyền truy cập khu vực này!');
    }
  }, [user, loading, isLoggingOut, allowedRoles, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleBasedRoute;
