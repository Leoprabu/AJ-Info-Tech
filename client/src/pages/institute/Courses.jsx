import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead } from '../../components/ui';

const empty = { course_name: '', fees: '', duration_days: '', current_offer: '', status: 'active' };

export default function Courses() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState(empty);

  const load = async () => setRows((await api.get('/inst/courses')).data);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!f.course_name) return alert('Course name required');
    if (editId) await api.put(`/inst/courses/${editId}`, f);
    else await api.post('/inst/courses', f);
    setOpen(false); load();
  };
  const setStatus = async (r, status) => { await api.put(`/inst/courses/${r.id}`, { status }); load(); };

  return (
    <div>
      <PageHead title="Course">
        <button className="btn" onClick={() => { setF(empty); setEditId(null); setOpen(true); }}>＋ Add Course</button>
      </PageHead>
      <div className="muted" style={{ margin: '-10px 0 12px 4px' }}>ℹ️ Tuition — monthly fees only</div>
      <DataTable pageSize={15} rows={rows} columns={[
        { key: 'sno', label: 'S.No', render: (r, i) => i },
        { key: 'course_name', label: 'Course Name' },
        { key: 'fees', label: 'Fees', render: r => '₹ ' + Number(r.fees || 0).toLocaleString('en-IN') },
        { key: 'duration_days', label: 'Duration (Days)' },
        { key: 'current_offer', label: 'Current Offer' },
        { key: 'status', label: 'Status', render: r => (
          <span className={`pill ${r.status === 'active' ? 'pill-green' : 'pill-red'}`}>{r.status}</span>) },
      ]} actions={r => (
        <>
          <button className="icon-btn gold" title="Edit" onClick={() => { setF({ ...empty, ...r, fees: String(r.fees), duration_days: String(r.duration_days) }); setEditId(r.id); setOpen(true); }}>✏️</button>
          <select className={`status-select ${r.status}`} value={r.status}
            onChange={e => setStatus(r, e.target.value)} title="Active / Inactive">
            <option value="active">🟢 Active</option>
            <option value="inactive">🔴 Inactive</option>
          </select>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Course' : 'Add Course'}>
        <div className="form-grid">
          <F label="Course Name" full><input value={f.course_name} onChange={e => setF({ ...f, course_name: e.target.value })} /></F>
          <F label="Fees (₹)"><input type="number" value={f.fees} onChange={e => setF({ ...f, fees: e.target.value })} /></F>
          <F label="Duration in Days"><input type="number" value={f.duration_days} onChange={e => setF({ ...f, duration_days: e.target.value })} /></F>
          <F label="Current Offer"><input value={f.current_offer || ''} onChange={e => setF({ ...f, current_offer: e.target.value })} /></F>
          <F label="Status">
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </F>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </Modal>
    </div>
  );
}