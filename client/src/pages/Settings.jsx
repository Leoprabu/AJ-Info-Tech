import React, { useEffect, useState } from 'react';
import api from '../api';
import { F, ImageUpload, PageHead, DataTable } from '../components/ui';
import { useAuth, hasPerm, ALL_PERMS } from '../AuthContext';

const PERM_GROUPS = [
  { head: 'Institute', keys: ['inst.enquiries','inst.students','inst.courses','inst.payment','inst.certificate','inst.trainers','inst.alumni'] },
  { head: 'IT Solutions', keys: ['it.enquiries','it.clients','it.staffs','it.projects','it.payment'] },
  { head: 'Finance', keys: ['fin.expenses','fin.otherincome','fin.accounts','fin.report'] },
];

export default function Settings() {
  const { settings, reloadSettings, user } = useAuth();
  const isAdmin = ['superadmin', 'admin'].includes(user?.role);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(null);
  const [banks, setBanks] = useState([]);
  const [users, setUsers] = useState([]);
  const [openUser, setOpenUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);

  const load = async () => {
    const s = (await api.get('/settings')).data;
    setF({ ...s, gst_percent: String(s.gst_percent ?? 18) });
    setBanks(s.banks?.length ? s.banks : [{ bank_name: '', branch_name: '', ifsc: '', account_no: '' }]);
    if (isAdmin) {
      const u = (await api.get('/users')).data;
      setUsers(u);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  if (!f) return <div className="loading">Loading settings…</div>;

  const save = async () => {
    await api.put('/settings', { ...f, gst_percent: Number(f.gst_percent) || 18, banks });
    await reloadSettings(); setEdit(false); alert('✔ Office details saved');
  };
  const setBank = (i, k, v) => setBanks(b => b.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const savePerms = async () => {
    await api.put(`/users/${openUser.id}`, { ...openUser, permissions: userPerms });
    setOpenUser(null); load(); alert('✔ Permissions updated');
  };

  return (
    <div>
      <PageHead title="Settings">
        {!edit && isAdmin && <button className="btn" onClick={() => setEdit(true)}>✏️ Edit Office Details</button>}
        {edit && <>
          <button className="btn ghost" onClick={() => setEdit(false)}>Cancel</button>
          <button className="btn green" onClick={save}>💾 Save</button>
        </>}
      </PageHead>

      {/* ---- Office details ---- */}
      <div className="table-wrap" style={{ padding: 22 }}>
        <h3 style={{ color: 'var(--maroon)', marginBottom: 16 }}>🏢 Office Details</h3>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
          <ImageUpload label="Logo" value={f.logo} onChange={v => setF({ ...f, logo: v })} />
          <ImageUpload label="Signature (image format)" value={f.sign_image} onChange={v => setF({ ...f, sign_image: v })} />
          <ImageUpload label="Seal (image format)" value={f.seal_image} onChange={v => setF({ ...f, seal_image: v })} />
        </div>
        <div className="form-grid" style={{ marginTop: 18 }}>
          <F label="Institute Name"><input disabled={!edit} value={f.name || ''} onChange={e => setF({ ...f, name: e.target.value })} /></F>
          <F label="Email"><input disabled={!edit} value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} /></F>
          <F label="Address" full><textarea disabled={!edit} value={f.address || ''} onChange={e => setF({ ...f, address: e.target.value })} /></F>
          <F label="Mobile"><input disabled={!edit} value={f.mobile || ''} onChange={e => setF({ ...f, mobile: e.target.value })} /></F>
          <F label="Alternate Mobile"><input disabled={!edit} value={f.alt_mobile || ''} onChange={e => setF({ ...f, alt_mobile: e.target.value })} /></F>
          <F label="Website"><input disabled={!edit} value={f.website || ''} onChange={e => setF({ ...f, website: e.target.value })} /></F>
          <F label="UPI ID"><input disabled={!edit} value={f.upi_id || ''} onChange={e => setF({ ...f, upi_id: e.target.value })} /></F>
          <F label="GSTIN"><input disabled={!edit} value={f.gstin || ''} onChange={e => setF({ ...f, gstin: e.target.value })} /></F>
          <F label="PAN"><input disabled={!edit} value={f.pan || ''} onChange={e => setF({ ...f, pan: e.target.value })} /></F>
          <F label="Invoice GST %"><input disabled={!edit} type="number" value={f.gst_percent} onChange={e => setF({ ...f, gst_percent: e.target.value })} /></F>
          <F label="Receipt Footer Note" full><input disabled={!edit} value={f.footer_note || ''} onChange={e => setF({ ...f, footer_note: e.target.value })} placeholder="e.g. Fees once paid is non-refundable" /></F>
        </div>

        <h3 style={{ color: 'var(--maroon)', margin: '22px 0 10px' }}>🏦 Bank Details (2–3 banks)</h3>
        {banks.map((b, i) => (
          <div className="bank-row" key={i}>
            <F label="Bank Name"><input disabled={!edit} value={b.bank_name || ''} onChange={e => setBank(i, 'bank_name', e.target.value)} /></F>
            <F label="Branch"><input disabled={!edit} value={b.branch_name || ''} onChange={e => setBank(i, 'branch_name', e.target.value)} /></F>
            <F label="IFSC"><input disabled={!edit} value={b.ifsc || ''} onChange={e => setBank(i, 'ifsc', e.target.value)} /></F>
            <F label="Account No"><input disabled={!edit} value={b.account_no || ''} onChange={e => setBank(i, 'account_no', e.target.value)} /></F>
            {edit && banks.length > 1 && <button className="icon-btn red" onClick={() => setBanks(banks.filter((_, j) => j !== i))}>🗑</button>}
          </div>
        ))}
        {edit && banks.length < 3 && <button className="btn ghost sm" onClick={() => setBanks([...banks, { bank_name: '', branch_name: '', ifsc: '', account_no: '' }])}>＋ Add Bank</button>}
      </div>

      {/* ---- Users & role permissions ---- */}
      {isAdmin && (
        <div style={{ marginTop: 26 }}>
          <h3 className="row-head">👥 Users, Roles & Access Permissions</h3>
          <DataTable rows={users} columns={[
            { key: 'name', label: 'Name' },
            { key: 'username', label: 'Username' },
            { key: 'role', label: 'Role' },
            { key: 'mobile', label: 'Mobile' },
            { key: 'permcount', label: 'Permissions', render: r => {
              if (['superadmin', 'admin'].includes(r.role)) return <span className="pill pill-green">ALL</span>;
              let p = []; try { p = JSON.parse(r.permissions || '[]'); } catch {}
              return `${p.length} module(s)`; } },
          ]} actions={r => (
            <button className="btn ghost sm" onClick={() => {
              let p = []; try { p = JSON.parse(r.permissions || '[]'); } catch {}
              setUserPerms(p); setOpenUser(r);
            }}>⚙️ Permissions</button>
          )} />
        </div>
      )}

      {/* ---- Permission editor modal ---- */}
      {openUser && (
        <div className="modal-overlay" onClick={() => setOpenUser(null)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head"><h3>Permissions — {openUser.name} ({openUser.role})</h3>
              <button className="modal-x" onClick={() => setOpenUser(null)}>✕</button></div>
            <div className="modal-body">
              <div className="muted" style={{ marginBottom: 8 }}>Ticked = user can access. Unticked = blocked.</div>
              {PERM_GROUPS.map(g => (
                <div key={g.head}>
                  <div className="perm-head">{g.head}</div>
                  <div className="perm-grid">
                    {g.keys.map(k => (
                      <label key={k}>
                        <input type="checkbox" checked={userPerms.includes(k)} onChange={() =>
                          setUserPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])} />
                        {k.split('.')[1]}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="form-actions">
                <button className="btn ghost" onClick={() => setOpenUser(null)}>Cancel</button>
                <button className="btn" onClick={savePerms}>Save Permissions</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}