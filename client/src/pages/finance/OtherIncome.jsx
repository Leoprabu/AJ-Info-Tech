import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead } from '../../components/ui';
import { today, inr } from '../../utils';

const SRC = ['Registration Fee', 'Certificate Fee', 'Form Sale', 'Xerox/Print', 'Software Service', 'Exam Fee', 'Other'];
const empty = () => ({ income_date: today(), source: 'Registration Fee', description: '', amount: '', method: 'Cash', received_from: '', remark: '' });

export default function OtherIncome() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState(empty());

  const load = async () => setRows((await api.get('/fin/otherincome')).data);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!Number(f.amount)) return alert('Amount required');
    if (editId) await api.put(`/fin/otherincome/${editId}`, f);
    else await api.post('/fin/otherincome', f);
    setOpen(false); load();
  };
  const monthTotal = rows.filter(r => r.income_date?.slice(0, 7) === today().slice(0, 7)).reduce((a, r) => a + Number(r.amount), 0);

  return (
    <div>
      <PageHead title="Other Income">
        <div className="pending-chip">This Month : <b>{inr(monthTotal)}</b></div>
        <button className="btn" onClick={() => { setF(empty()); setEditId(null); setOpen(true); }}>＋ Add Income</button>
      </PageHead>
      <DataTable rows={rows} columns={[
        { key: 'sno', label: 'S.No', render: (r, i) => i },
        { key: 'income_date', label: 'Date' },
        { key: 'source', label: 'Source' },
        { key: 'description', label: 'Description' },
        { key: 'received_from', label: 'Received From' },
        { key: 'method', label: 'Method' },
        { key: 'amount', label: 'Amount', render: r => <b className="text-green">{inr(r.amount)}</b> },
      ]} actions={r => (
        <>
          <button className="icon-btn gold" title="Edit" onClick={() => { setF({ ...empty(), ...r, amount: String(r.amount) }); setEditId(r.id); setOpen(true); }}>✏️</button>
          <button className="icon-btn red" title="Delete" onClick={() => { if (window.confirm('Delete this entry?')) { api.delete(`/fin/otherincome/${r.id}`).then(load); } }}>🗑</button>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Income' : 'Add Other Income'} width={620}>
        <div className="form-grid">
          <F label="Income Date"><input type="date" value={f.income_date} onChange={e => setF({ ...f, income_date: e.target.value })} /></F>
          <F label="Source">
            <select value={f.source} onChange={e => setF({ ...f, source: e.target.value })}>
              {SRC.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Description" full><input value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></F>
          <F label="Amount (₹)"><input type="number" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></F>
          <F label="Payment Method">
            <select value={f.method} onChange={e => setF({ ...f, method: e.target.value })}>
              <option>Cash</option><option>GPAY</option><option>Bank</option>
            </select>
          </F>
          <F label="Received From"><input value={f.received_from} onChange={e => setF({ ...f, received_from: e.target.value })} /></F>
          <F label="Remark (optional)"><input value={f.remark || ''} onChange={e => setF({ ...f, remark: e.target.value })} /></F>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </Modal>
    </div>
  );
}