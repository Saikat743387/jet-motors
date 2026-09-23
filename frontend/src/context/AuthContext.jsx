import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [{ data: me }, { data: pub }] = await Promise.all([
        api.get('/auth/me'),
        api.get('/settings'),
      ]);
      setUser(me.user);
      setSettings(pub);
    } catch {
      setUser(null);
      try {
        const { data: pub } = await api.get('/settings');
        setSettings(pub);
      } catch {
        setSettings(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('jm_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('jm_token', data.token);
    setUser(data.user);
    try {
      const { data: me } = await api.get('/auth/me');
      if (me?.user) setUser(me.user);
    } catch {
      /* keep register response as fallback */
    }
    return data.user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem('jm_token');
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, settings, loading, login, register, logout, refresh, setUser }),
    [user, settings, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
