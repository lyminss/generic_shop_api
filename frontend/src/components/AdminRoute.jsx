import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      toast.error('Bạn không có quyền truy cập trang quản trị!');
    }
  }, [user, loading, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
