import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, ImageUpload, PageHead } from '../../components/ui';
import { today } from '../../utils';

const empty = () => ({ staff_id: '', name: '', mobile: '', email: '', address: '', aadhar: '',
  qualification: '', join_date: today(), salary: '', photo: '', status: 'active', remarks: '' });

export default function StaffPage({ title, endpoint, addLabel, idPrefix }) {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState(null);
  const [f, setF] = useState(empty());

  const load = async () => setRows((await api.get(`/${endpoint}`)).data);
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    const nums = rows.map(r => parseInt(String(r.staff_id).replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    setF({ ...empty(), staff_id: `${idPrefix}${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}` });
    setEditId(null); setOpen(true);
  };
  const save = async () => {
    if (!f.name || !f.mobile) return alert('Name & Mobile required');
    if (editId) await api.put(`/${endpoint}/${editId}`, f);
    else await api.post(`/${endpoint}`, f);
    setOpen(false); load();
  };
  const del = async r => { if (window.confirm(`Delete ${r.name}?`)) { await api.delete(`/${endpoint}/${r.id}`); load(); } };

  const form = (
    <>
      <div className="form-grid">
        <F label="Staff ID"><input value={f.staff_id} onChange={e => setF({ ...f, staff_id: e.target.value })} /></F>
        <F label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></F>
        <F label="Mobile"><input value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} /></F>
        <F label="Email"><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></F>
        <F label="Aadhar Number"><input value={f.aadhar} onChange={e => setF({ ...f, aadhar: e.target.value })} /></F>
        <F label="Qualification"><input value={f.qualification} onChange={e => setF({ ...f, qualification: e.target.value })} /></F>
        <F label="Join Date"><input type="date" value={f.join_date || ''} onChange={e => setF({ ...f, join_date: e.target.value })} /></F>
        <F label="Salary (₹)"><input type="number" value={f.salary} onChange={e => setF({ ...f, salary: e.target.value })} /></F>
        <F label="Status">
          <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </F>
        <F label="Address" full><textarea value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></F>
        <F label="Remarks" full><textarea value={f.remarks || ''} onChange={e => setF({ ...f, remarks: e.target.value })} /></F>
        <div className="full"><ImageUpload label="Photo" value={f.photo} onChange={v => setF({ ...f, photo: v })} round /></div>
      </div>
      <div className="form-actions">
        <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn" onClick={save}>Save</button>
      </div>
    </>
  );

  return (
    <div>
      <PageHead title={title}><button className="btn" onClick={openAdd}>＋ {addLabel}</button></PageHead>
      <DataTable rows={rows} columns={[
        { key: 'staff_id', label: 'Staff ID' },
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email' },
        { key: 'salary', label: 'Salary', render: r => '₹ ' + Number(r.salary || 0).toLocaleString('en-IN') },
        { key: 'status', label: 'Status', render: r => (
          <span className={`pill ${r.status === 'active' ? 'pill-green' : 'pill-red'}`}>{r.status}</span>) },
      ]} actions={r => (
        <>
          <button className="icon-btn" title="View" onClick={() => setView(r)}>👁</button>
          <button className="icon-btn gold" title="Edit" onClick={() => {
            setF({ ...empty(), ...r, salary: String(r.salary), join_date: r.join_date || today() }); setEditId(r.id); setOpen(true); }}>✏️</button>
          <button className="icon-btn red" title="Delete" onClick={() => del(r)}>🗑</button>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? `Edit — ${f.name}` : addLabel} width={680}>{form}</Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={`View — ${view?.name || ''}`} width={560}>
        {view && (
          <div className="user-row">
            {view.photo && <img src={view.photo} alt="" style={{ width: 74, height: 74, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />}
            <p><b>Staff ID:</b> {view.staff_id}</p><p><b>Name:</b> {view.name}</p>
            <p><b>Mobile:</b> {view.mobile}</p><p><b>Email:</b> {view.email}</p>
            <p><b>Address:</b> {view.address}</p><p><b>Aadhar:</b> {view.aadhar}</p>
            <p><b>Qualification:</b> {view.qualification}</p><p><b>Join Date:</b> {view.join_date}</p>
            <p><b>Salary:</b> ₹{Number(view.salary || 0).toLocaleString('en-IN')}</p>
            <p><b>Status:</b> {view.status}</p><p><b>Remarks:</b> {view.remarks || '-'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}