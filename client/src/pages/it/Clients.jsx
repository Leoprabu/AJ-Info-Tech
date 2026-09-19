import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead } from '../../components/ui';

const empty = { company_name: '', client_name: '', project: '', mobile: '', email: '',
  aadhar: '', address: '', gst: '', monthly_pay: '', status: 'active' };

export default function Clients() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState(null);
  const [f, setF] = useState(empty);

  const load = async () => setRows((await api.get('/it/clients')).data);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!f.company_name || !f.client_name) return alert('Company & Client name required');
    if (editId) await api.put(`/it/clients/${editId}`, f);
    else await api.post('/it/clients', f);
    setOpen(false); load();
  };

  return (
    <div>
      <PageHead title="Client"><button className="btn" onClick={() => { setF(empty); setEditId(null); setOpen(true); }}>＋ Add Client</button></PageHead>
      <DataTable rows={rows} columns={[
        { key: 'sno', label: 'S.No', render: (r, i) => i },
        { key: 'company_name', label: 'Company Name' },
        { key: 'client_name', label: 'Client Name' },
        { key: 'project', label: 'Project' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'gst', label: 'GST' },
        { key: 'monthly_pay', label: 'Monthly Pay', render: r => r.monthly_pay ? '₹ ' + Number(r.monthly_pay).toLocaleString('en-IN') : '-' },
        { key: 'status', label: 'Status', render: r => (
          <span className={`pill ${r.status === 'active' ? 'pill-green' : 'pill-red'}`}>{r.status}</span>) },
      ]} actions={r => (
        <>
          <button className="icon-btn" title="View" onClick={() => setView(r)}>👁</button>
          <button className="icon-btn gold" title="Edit" onClick={() => { setF({ ...empty, ...r, monthly_pay: String(r.monthly_pay || '') }); setEditId(r.id); setOpen(true); }}>✏️</button>
          <button className="icon-btn red" title="Delete" onClick={() => { if (window.confirm('Delete this client?')) { api.delete(`/it/clients/${r.id}`).then(load); } }}>🗑</button>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Client' : 'Add Client'} width={640}>
        <div className="form-grid">
          <F label="Company Name"><input value={f.company_name} onChange={e => setF({ ...f, company_name: e.target.value })} /></F>
          <F label="Client Name"><input value={f.client_name} onChange={e => setF({ ...f, client_name: e.target.value })} /></F>
          <F label="Project"><input value={f.project} onChange={e => setF({ ...f, project: e.target.value })} /></F>
          <F label="Mobile"><input value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} /></F>
          <F label="Email"><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></F>
          <F label="Aadhar Number"><input value={f.aadhar} onChange={e => setF({ ...f, aadhar: e.target.value })} /></F>
          <F label="GST Number"><input value={f.gst} onChange={e => setF({ ...f, gst: e.target.value })} /></F>
          <F label="Monthly Pay (₹) (if monthly client)"><input type="number" value={f.monthly_pay} onChange={e => setF({ ...f, monthly_pay: e.target.value })} /></F>
          <F label="Status">
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </F>
          <F label="Address" full><textarea value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></F>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={`Client — ${view?.company_name || ''}`} width={560}>
        {view && (
          <div className="user-row">
            <p><b>Company:</b> {view.company_name}</p><p><b>Client:</b> {view.client_name}</p>
            <p><b>Project:</b> {view.project}</p><p><b>Mobile:</b> {view.mobile}</p>
            <p><b>Email:</b> {view.email}</p><p><b>GST:</b> {view.gst}</p>
            <p><b>Monthly Pay:</b> {view.monthly_pay ? '₹' + Number(view.monthly_pay).toLocaleString('en-IN') : '-'}</p>
            <p><b>Address:</b> {view.address}</p><p><b>Status:</b> {view.status}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}