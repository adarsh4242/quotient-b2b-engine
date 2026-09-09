import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('quotient_user') || 'null'));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem('quotient_token') && !localStorage.getItem('token')) return setLoading(false);
    api.get('/api/auth/me').then(({ data }) => setUser(data.user)).catch(() => logout()).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const handleAuthExpired = () => logout();
    window.addEventListener('quotient:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('quotient:auth-expired', handleAuthExpired);
  }, []);
  const login = async (values) => { const { data } = await api.post('/api/auth/login', values); persist(data); };
  const register = async (values) => { const { data } = await api.post('/api/auth/register', values); persist(data); };
  const persist = ({ token, user: nextUser }) => { localStorage.setItem('quotient_token', token); localStorage.setItem('token', token); localStorage.setItem('quotient_user', JSON.stringify(nextUser)); setUser(nextUser); };
  const logout = () => { localStorage.removeItem('quotient_token'); localStorage.removeItem('token'); localStorage.removeItem('quotient_user'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);