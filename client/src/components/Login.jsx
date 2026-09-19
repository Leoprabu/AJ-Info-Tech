import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const { data } = await api.post('/auth/login', f);
      await login(data.token);
      nav('/');
    } catch (ex) {
      setErr(ex.response?.data?.msg || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <img src="/logo.png" alt="AJ INFO TECH" onError={e => e.target.style.visibility = 'hidden'} />
        <h1>AJ <span className="gold">INFO TECH</span></h1>
        <p>IT Solutions | Institute</p>
      </div>
      <div className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <h2>Welcome Back 👋</h2>
          <div className="sub">Sign in to your management dashboard</div>
          {err && <div className="login-err">⚠ {err}</div>}
          <div className="field full" style={{ marginBottom: 14 }}>
            <span>Username</span>
            <input autoFocus value={f.username} onChange={e => setF({ ...f, username: e.target.value })} placeholder="Enter username" required />
          </div>
          <div className="field full">
            <span>Password</span>
            <input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} placeholder="Enter password" required />
          </div>
          <button className="btn maroon" style={{ width: '100%', justifyContent: 'center', marginTop: 22 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Login →'}
          </button>
          <div className="login-hint">Default login → admin / admin123</div>
        </form>
      </div>
    </div>
  );
}