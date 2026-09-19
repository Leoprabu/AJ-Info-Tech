import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api';

const Ctx = createContext(null);
export const ALL_PERMS = ['inst.enquiries','inst.students','inst.courses','inst.payment','inst.certificate','inst.trainers','inst.alumni','it.enquiries','it.clients','it.staffs','it.projects','it.payment','fin.expenses','fin.otherincome','fin.accounts','fin.report'];

export const hasPerm = (user, key) => {
  if (!user) return false;
  if (['superadmin', 'admin'].includes(user.role)) return true;
  try { return (JSON.parse(user.permissions || '[]')).includes(key); } catch { return false; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const t = localStorage.getItem('aj_token');
    if (!t) { setReady(true); return; }
    try {
      const [u, s] = await Promise.all([api.get('/auth/me'), api.get('/settings')]);
      setUser(u.data); setSettings(s.data);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async token => { localStorage.setItem('aj_token', token); await refresh(); };
  const logout = () => { localStorage.removeItem('aj_token'); setUser(null); };
  const reloadSettings = refresh;

  return <Ctx.Provider value={{ user, settings, ready, login, logout, reloadSettings, setUser }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);