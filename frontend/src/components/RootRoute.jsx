import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../pages/LandingPage';

const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'STAFF') {
      return <Navigate to="/staff" replace />;
    }
    if (user.role === 'BARISTA') {
      return <Navigate to="/barista" replace />;
    }
  }

  return <LandingPage />;
};

export default RootRoute;
