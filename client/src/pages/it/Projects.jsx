import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead } from '../../components/ui';
import { today, inr } from '../../utils';

const empty = () => ({ project_id: '', project_name: '', company_name: '', client_id: '',
  payment_type: 'installment', project_value: '', monthly_amount: '', installments: '3',
  start_date: today(), status: 'planning', remarks: '' });
const STATUSES = ['planning', 'in process', 'hold', 'complete', 'cancelled'];

export default function Projects() {
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState(null);
  const [f, setF] = useState(empty());

  const load = async () => {
    const [a, b] = await Promise.all([api.get('/it/projects'), api.get('/it/clients')]);
    setRows(a.data); setClients(b.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!f.project_name || !f.client_id) return alert('Project name & client required');
    const payload = { ...f, project_value: f.payment_type === 'installment' ? f.project_value : '',
      monthly_amount: f.payment_type === 'monthly' ? f.monthly_amount : '', client_id: f.client_id || null };
    if (editId) await api.put(`/it/projects/${editId}`, payload);
    else await api.post('/it/projects', payload);
    setOpen(false); load();
  };

  const clientOf = r => clients.find(c => c.id === r.client_id);

  return (
    <div>
      <PageHead title="Projects"><button className="btn" onClick={() => { setF({ ...empty(), project_id: 'PRJ' + String(rows.length + 1).padStart(3, '0') }); setEditId(null); setOpen(true); }}>＋ Add Project</button></PageHead>
      <DataTable rows={rows} columns={[
        { key: 'project_id', label: 'Project ID' },
        { key: 'project_name', label: 'Project Name' },
        { key: 'client', label: 'Client Name', render: r => clientOf(r)?.client_name || '-' },
        { key: 'company_name', label: 'Company Name' },
        { key: 'payment_type', label: 'Payment Type', render: r => (
          <span className={`pill ${r.payment_type === 'monthly' ? 'pill-gold' : 'pill-maroon'}`}>
            {r.payment_type === 'monthly' ? `Monthly ${inr(r.monthly_amount)}` : `Installments × ${r.installments}`}</span>) },
        { key: 'status', label: 'Status', render: r => (
          <span className={`pill ${r.status === 'complete' ? 'pill-green' : r.status === 'cancelled' || r.status === 'hold' ? 'pill-red' : 'pill-gold'}`}>{r.status}</span>) },
      ]} actions={r => (
        <>
          <button className="icon-btn" title="View" onClick={() => setView(r)}>👁</button>
          <button className="icon-btn gold" title="Edit" onClick={() => {
            setF({ ...empty(), ...r, project_value: String(r.project_value || ''), monthly_amount: String(r.monthly_amount || ''),
              installments: String(r.installments || 3), client_id: String(r.client_id || ''), start_date: r.start_date || today() });
            setEditId(r.id); setOpen(true); }}>✏️</button>
          <button className="icon-btn red" title="Delete" onClick={() => { if (window.confirm('Delete this project?')) { api.delete(`/it/projects/${r.id}`).then(load); } }}>🗑</button>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Project' : 'Add Project'} width={660}>
        <div className="form-grid">
          <F label="Project ID"><input value={f.project_id} onChange={e => setF({ ...f, project_id: e.target.value })} /></F>
          <F label="Project Name"><input value={f.project_name} onChange={e => setF({ ...f, project_name: e.target.value })} /></F>
          <F label="Company Name"><input value={f.company_name} onChange={e => setF({ ...f, company_name: e.target.value })} /></F>
          <F label="Client (from Client page)">
            <select value={f.client_id} onChange={e => {
              const c = clients.find(x => String(x.id) === e.target.value);
              setF({ ...f, client_id: e.target.value, company_name: c ? c.company_name : f.company_name }); }}>
              <option value="">-- Select Client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.client_name} — {c.company_name}</option>)}
            </select>
          </F>
          <F label="Payment Method" full>
            <div className="seg">
              <button type="button" className={f.payment_type === 'installment' ? 'on' : ''} onClick={() => setF({ ...f, payment_type: 'installment' })}>① Project Value — 3 Installments</button>
              <button type="button" className={f.payment_type === 'monthly' ? 'on' : ''} onClick={() => setF({ ...f, payment_type: 'monthly' })}>② Monthly Payment</button>
            </div>
          </F>
          {f.payment_type === 'installment' ? (
            <>
              <F label="Total Project Value (₹)"><input type="number" value={f.project_value} onChange={e => setF({ ...f, project_value: e.target.value })} /></F>
              <F label="Installments">
                <select value={f.installments} onChange={e => setF({ ...f, installments: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </F>
              {!!f.project_value && (
                <div className="full muted">Each installment ≈ <b style={{ color: 'var(--maroon)' }}>
                  {inr(Number(f.project_value) / Number(f.installments || 3))}</b></div>
              )}
            </>
          ) : (
            <F label="Monthly Amount (₹)"><input type="number" value={f.monthly_amount} onChange={e => setF({ ...f, monthly_amount: e.target.value })} /></F>
          )}
          <F label="Start Date"><input type="date" value={f.start_date || ''} onChange={e => setF({ ...f, start_date: e.target.value })} /></F>
          <F label="Status">
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
          <F label="Remarks" full><textarea value={f.remarks || ''} onChange={e => setF({ ...f, remarks: e.target.value })} /></F>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={`Project — ${view?.project_name || ''}`} width={580}>
        {view && (
          <div className="user-row">
            <p><b>Project ID:</b> {view.project_id}</p><p><b>Name:</b> {view.project_name}</p>
            <p><b>Company:</b> {view.company_name}</p>
            <p><b>Client:</b> {clientOf(view)?.client_name || '-'}</p>
            <p><b>Payment:</b> {view.payment_type === 'monthly' ? `Monthly ${inr(view.monthly_amount)}` : `₹${Number(view.project_value).toLocaleString('en-IN')} × ${view.installments} installments`}</p>
            <p><b>Start:</b> {view.start_date}</p><p><b>Status:</b> {view.status}</p>
            <p><b>Remarks:</b> {view.remarks || '-'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}