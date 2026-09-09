import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('school_erp_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount or token change
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await API.get('/api/auth/me');
        const userData = response.data;
        const normalizedRole = typeof userData.role === 'object' ? userData.role.name : userData.role;
        setUser({ ...userData, role: normalizedRole, role_obj: userData.role });
      } catch (err) {
        console.error('Session validation error:', err);
        localStorage.removeItem('school_erp_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await API.post('/api/auth/login', {
        username_or_email: usernameOrEmail,
        password: password,
      });

      const { access_token } = response.data;
      localStorage.setItem('school_erp_token', access_token);
      setToken(access_token);

      // Fetch user profile info
      const meResponse = await API.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userData = meResponse.data;
      const normalizedRole = typeof userData.role === 'object' ? userData.role.name : userData.role;
      const finalUser = { ...userData, role: normalizedRole, role_obj: userData.role };
      setUser(finalUser);
      return finalUser;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check credentials.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('school_erp_token');
    setToken(null);
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await API.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change password.';
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
