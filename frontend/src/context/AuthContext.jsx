import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check if token exists in local storage
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user profile
      authService.getProfile()
        .then(response => {
          setUser(response.data);
        })
        .catch(err => {
          console.error("Failed to fetch user profile", err);
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    // Listen for 401 unauthorized events from Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent('shop:logout'));
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setIsLoggingOut(false);
    const res = await authService.login({ email, password });
    const token = res.data?.token || res.data;
    if (token && typeof token === 'string') {
      localStorage.setItem('token', token);
      const profileRes = await authService.getProfile();
      setUser(profileRes.data);
      return profileRes.data;
    }
    return res.data;
  };

  const googleLogin = async (credential, profileData = {}) => {
    setIsLoggingOut(false);
    const res = await authService.googleLogin({
      credential,
      ...profileData,
    });
    const token = res.data?.token;
    if (token) {
      localStorage.setItem('token', token);
      const profileRes = await authService.getProfile();
      setUser(profileRes.data);
      return profileRes.data;
    }
    return res.data;
  };

  const quickLogin = async (role) => {
    setIsLoggingOut(false);
    const res = await authService.quickLogin({ role });
    const token = res.data?.token;
    if (token) {
      localStorage.setItem('token', token);
      const profileRes = await authService.getProfile();
      setUser(profileRes.data);
      return profileRes.data;
    }
    return res.data;
  };

  const refreshUser = async () => {
    try {
      const profileRes = await authService.getProfile();
      setUser(profileRes.data);
      return profileRes.data;
    } catch (err) {
      console.error("Failed to refresh user", err);
      return null;
    }
  };

  const logout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('token');
    setUser(null);
    window.dispatchEvent(new CustomEvent('shop:logout'));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggingOut,
      login,
      googleLogin,
      quickLogin,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
