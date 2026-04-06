'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { getMe } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      getMe()
        .then(res => setUser(res.data.user))
        .catch(() => {
          Cookies.remove('token');
          Cookies.remove('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData) => {
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    setUser(userData);
  };

  const logoutUser = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
