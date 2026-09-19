import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead } from '../../components/ui';
import { today, inr } from '../../utils';

const CATS = ['Rent', 'Salary', 'Electricity', 'Internet', 'Stationery', 'Advertisement', 'Maintenance', 'Travel', 'Tea/Snacks', 'Misc'];
const empty = () => ({ expense_date: today(), category: 'Rent', description: '', amount: '', method: 'Cash', paid_to: '', voucher_no: '', remark: '' });

export default function Expenses() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState(empty());

  const load = async () => setRows((await api.get('/fin/expenses')).data);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setF({ ...empty(), voucher_no: 'VCH' + String(rows.length + 1).padStart(4, '0') }); setEditId(null); setOpen(true); };
  const save = async () => {
    if (!Number(f.amount)) return alert('Amount required');
    if (editId) await api.put(`/fin/expenses/${editId}`, f);
    else await api.post('/fin/expenses', f);
    setOpen(false); load();
  };
  const monthTotal = rows.filter(r => r.expense_date?.slice(0, 7) === today().slice(0, 7)).reduce((a, r) => a + Number(r.amount), 0);

  return (
    <div>
      <PageHead title="Expenses">
        <div className="pending-chip">This Month : <b>{inr(monthTotal)}</b></div>
        <button className="btn" onClick={openAdd}>＋ Add Expense</button>
      </PageHead>
      <DataTable rows={rows} columns={[
        { key: 'sno', label: 'S.No', render: (r, i) => i },
        { key: 'expense_date', label: 'Date' },
        { key: 'voucher_no', label: 'Voucher No' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'paid_to', label: 'Paid To' },
        { key: 'method', label: 'Method' },
        { key: 'amount', label: 'Amount', render: r => <b className="text-red">{inr(r.amount)}</b> },
      ]} actions={r => (
        <>
          <button className="icon-btn gold" title="Edit" onClick={() => { setF({ ...empty(), ...r, amount: String(r.amount) }); setEditId(r.id); setOpen(true); }}>✏️</button>
          <button className="icon-btn red" title="Delete" onClick={() => { if (window.confirm('Delete this expense?')) { api.delete(`/fin/expenses/${r.id}`).then(load); } }}>🗑</button>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Expense' : 'Add Expense'} width={620}>
        <div className="form-grid">
          <F label="Expense Date"><input type="date" value={f.expense_date} onChange={e => setF({ ...f, expense_date: e.target.value })} /></F>
          <F label="Category">
            <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Description" full><input value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></F>
          <F label="Amount (₹)"><input type="number" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></F>
          <F label="Payment Method">
            <select value={f.method} onChange={e => setF({ ...f, method: e.target.value })}>
              <option>Cash</option><option>GPAY</option><option>Bank</option>
            </select>
          </F>
          <F label="Paid To"><input value={f.paid_to} onChange={e => setF({ ...f, paid_to: e.target.value })} /></F>
          <F label="Voucher No"><input value={f.voucher_no} onChange={e => setF({ ...f, voucher_no: e.target.value })} /></F>
          <F label="Remark (optional)" full><input value={f.remark || ''} onChange={e => setF({ ...f, remark: e.target.value })} /></F>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </Modal>
    </div>
  );
}