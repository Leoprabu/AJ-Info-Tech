import React, { useState } from 'react';
import { createPortal } from 'react-dom';                       // ← CHANGED
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, hasPerm, ALL_PERMS } from '../AuthContext';
import api from '../api';
import { Modal, F, ImageUpload } from './ui';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/', dash: true },
  { head: 'Institute' },
  { key: 'inst.enquiries', label: 'Enquiries', icon: '📝', path: '/institute/enquiries' },
  { key: 'inst.students', label: 'Students', icon: '🎓', path: '/institute/students' },
  { key: 'inst.courses', label: 'Course', icon: '📚', path: '/institute/courses' },
  { key: 'inst.payment', label: 'Payment', icon: '💳', path: '/institute/payment' },
  { key: 'inst.certificate', label: 'Certificate', icon: '🏅', path: '/institute/certificates' },
  { key: 'inst.trainers', label: 'Trainers', icon: '👨‍🏫', path: '/institute/trainers' },
  { key: 'inst.alumni', label: 'Alumni', icon: '🤝', path: '/institute/alumni' },
  { head: 'IT Solutions' },
  { key: 'it.enquiries', label: 'Enquiries', icon: '📝', path: '/it/enquiries' },
  { key: 'it.clients', label: 'Client', icon: '🏢', path: '/it/clients' },
  { key: 'it.staffs', label: 'Staffs', icon: '🧑‍💻', path: '/it/staffs' },
  { key: 'it.projects', label: 'Projects', icon: '📁', path: '/it/projects' },
  { key: 'it.payment', label: 'Payment', icon: '💳', path: '/it/payment' },
  { head: 'Finance' },
  { key: 'fin.expenses', label: 'Expenses', icon: '🧾', path: '/finance/expenses' },
  { key: 'fin.otherincome', label: 'Other Income', icon: '💰', path: '/finance/other-income' },
  { key: 'fin.accounts', label: 'Accounts', icon: '📘', path: '/finance/accounts' },
  { key: 'fin.report', label: 'Report', icon: '📈', path: '/finance/reports' },
];

const PERM_GROUPS = [
  { head: 'Institute', keys: ['inst.enquiries','inst.students','inst.courses','inst.payment','inst.certificate','inst.trainers','inst.alumni'] },
  { head: 'IT Solutions', keys: ['it.enquiries','it.clients','it.staffs','it.projects','it.payment'] },
  { head: 'Finance', keys: ['fin.expenses','fin.otherincome','fin.accounts','fin.report'] },
];
const ROLE_DEFAULTS = {
  superadmin: ALL_PERMS, admin: ALL_PERMS,
  institute_admin: PERM_GROUPS[0].keys,
  it_admin: PERM_GROUPS[1].keys,
  accountant: PERM_GROUPS[2].keys,
};

/* ============ Add User modal ============ */
function AddUserModal({ open, onClose }) {
  const [f, setF] = useState({ name: '', username: '', password: '', email: '', mobile: '', role: 'institute_admin', photo: '' });
  const [perms, setPerms] = useState(ROLE_DEFAULTS.institute_admin);
  const [msg, setMsg] = useState('');
  const setRole = role => { setF({ ...f, role }); setPerms(ROLE_DEFAULTS[role] || []); };
  const toggle = k => setPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const save = async () => {
    setMsg('');
    try { await api.post('/users', { ...f, permissions: perms }); alert('✔ User added successfully'); onClose(); }
    catch (e) { setMsg(e.response?.data?.msg || 'Failed'); }
  };
  const reset = () => { setF({ name: '', username: '', password: '', email: '', mobile: '', role: 'institute_admin', photo: '' }); setPerms(ROLE_DEFAULTS.institute_admin); };
  return (
    <Modal open={open} onClose={onClose} title="Add User / Admin" width={620}>
      {msg && <div className="login-err">⚠ {msg}</div>}
      <ImageUpload label="Photo (optional)" value={f.photo} onChange={v => setF({ ...f, photo: v })} round />
      <div className="form-grid" style={{ marginTop: 14 }}>
        <F label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></F>
        <F label="Username"><input value={f.username} onChange={e => setF({ ...f, username: e.target.value })} /></F>
        <F label="Password"><input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></F>
        <F label="Role">
          <select value={f.role} onChange={e => setRole(e.target.value)}>
            <option value="superadmin">Super Admin (all access)</option>
            <option value="admin">Admin (all access)</option>
            <option value="institute_admin">Institute Admin</option>
            <option value="it_admin">IT Admin</option>
            <option value="accountant">Accountant</option>
          </select>
        </F>
        <F label="Email"><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></F>
        <F label="Mobile"><input value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} /></F>
      </div>
      <div className="perm-head">Access Permissions (tick = user can access)</div>
      {PERM_GROUPS.map(g => (
        <div key={g.head}>
          <div className="perm-head" style={{ color: '#9a7306' }}>{g.head}</div>
          <div className="perm-grid">
            {g.keys.map(k => (
              <label key={k}>
                <input type="checkbox" checked={perms.includes(k)} onChange={() => toggle(k)} />
                {NAV.find(n => n.key === k)?.label || k}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="form-actions">
        <button className="btn ghost" onClick={reset}>Reset</button>
        <button className="btn" onClick={save}>Add User</button>
      </div>
    </Modal>
  );
}

/* ============ Change Password modal ============ */
function ChangePwdModal({ open, onClose }) {
  const [f, setF] = useState({ old_password: '', new_password: '', confirm: '' });
  const [err, setErr] = useState('');
  const save = async () => {
    setErr('');
    if (f.new_password !== f.confirm) return setErr('New passwords do not match');
    try { await api.post('/auth/change-password', { old_password: f.old_password, new_password: f.new_password });
      alert('✔ Password changed successfully'); onClose(); }
    catch (e) { setErr(e.response?.data?.msg || 'Failed'); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Change Password" width={440}>
      {err && <div className="login-err">⚠ {err}</div>}
      <div className="form-grid">
        <F label="Old Password" full><input type="password" value={f.old_password} onChange={e => setF({ ...f, old_password: e.target.value })} /></F>
        <F label="New Password"><input type="password" value={f.new_password} onChange={e => setF({ ...f, new_password: e.target.value })} /></F>
        <F label="Confirm Password"><input type="password" value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })} /></F>
      </div>
      <div className="form-actions">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={save}>Update Password</button>
      </div>
    </Modal>
  );
}

/* ============ Topbar ============ */
function Topbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [addUser, setAddUser] = useState(false);
  const [chgPwd, setChgPwd] = useState(false);
  if (!user) return null;
  const isAdmin = ['superadmin', 'admin'].includes(user.role);
  return (
    <header className="topbar">
      <div className="user-chip" onClick={() => setOpen(!open)}>
        <div className="user-avatar">
          {user.photo ? <img src={user.photo} alt="" /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="#6d0f21"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z"/></svg>}
        </div>
        <div><div className="user-name">{user.name}</div><div className="user-role">{user.role.replace('_', ' ')}</div></div>
        <span style={{ fontSize: 11, color: '#9a8f95' }}>▼</span>
      </div>
      {open && (
        <div className="dropdown" onMouseLeave={() => setOpen(false)}>
          <div className="dd-head">
            <div className="user-avatar">{user.photo ? <img src={user.photo} alt="" /> : '👤'}</div>
            <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{user.name}</div>
              <div style={{ fontSize: 11, opacity: .75 }}>{user.email || user.username}</div></div>
          </div>
          {isAdmin && <button className="dd-item" onClick={() => { setOpen(false); setAddUser(true); }}>➕ Add User</button>}
          <button className="dd-item" onClick={() => { setOpen(false); setChgPwd(true); }}>🔑 Change Password</button>
          <button className="dd-item" onClick={() => { setOpen(false); nav('/settings'); }}>⚙️ Settings</button>
          <button className="dd-item out" onClick={() => { logout(); nav('/login'); }}>🚪 Logout</button>
        </div>
      )}

      {/* ===== CHANGED: modals render through a portal to <body> so they always
           appear IN FRONT of all page data (topbar stacking-context bug) ===== */}
      {createPortal(
        <>
          <AddUserModal open={addUser} onClose={() => setAddUser(false)} />
          <ChangePwdModal open={chgPwd} onClose={() => setChgPwd(false)} />
        </>,
        document.body
      )}
    </header>
  );
}

/* ============ Layout ============ */
export default function Layout() {
  const { user, settings } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-logo">
          <img src={settings?.logo || '/logo.png'} alt="logo" onError={e => e.target.style.display = 'none'} />
          <div className="side-name">AJ INFO TECH</div>
          <div className="side-tag">IT Solutions | Institute</div>
        </div>
        <nav className="side-nav">
          {NAV.map((n, i) => n.head
            ? <div className="side-head" key={i}>{n.head}</div>
            : (n.dash || hasPerm(user, n.key)) &&
              <NavLink key={n.key} to={n.path} end={n.dash}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
                <span>{n.icon}</span>{n.label}
              </NavLink>
          )}
        </nav>
      </aside>
      <div className="main-area">
        <Topbar />
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}