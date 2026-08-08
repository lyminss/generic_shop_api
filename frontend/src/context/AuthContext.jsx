import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const token = res.data.token || res.data;
    if (token && typeof token === 'string') {
      localStorage.setItem('token', token);
      const profileRes = await authService.getProfile();
      setUser(profileRes.data);
    }
    return res.data;
  };

  const refreshUser = async () => {
    try {
      const profileRes = await authService.getProfile();
      setUser(profileRes.data);
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
