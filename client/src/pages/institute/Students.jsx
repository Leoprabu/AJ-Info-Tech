import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, ImageUpload, PageHead } from '../../components/ui';
import { today, inr } from '../../utils';

const empty = () => ({ application_no: '', student_type: 'new', photo: '', name: '', father_name: '',
  mother_name: '', occupation: '', dob: '', gender: 'Male', mobile: '', email: '', course_id: '',
  aadhar: '', address: '', qualification: '', batch_timing: '',
  in_charge: ['', '', ''], full_fees: '', offer_fees: '', joined_date: today() });

export default function Students() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [billing, setBilling] = useState([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('new');           // new | existing
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState(empty());
  const [oldApp, setOldApp] = useState('');
  const [found, setFound] = useState(null);

  const load = async () => {
    const [a, b, c, d] = await Promise.all([
      api.get('/inst/students'), api.get('/inst/courses'),
      api.get('/inst/trainers'), api.get('/inst/billing')]);
    setRows(a.data);
    setCourses(b.data.filter(x => x.status === 'active'));
    setTrainers(c.data.filter(t => t.status === 'active'));
    setBilling(d.data);
  };
  useEffect(() => { load(); }, []);

  const balOf = id => billing.find(b => b.id === id);
  const nextAppNo = () => {
    const nums = rows.map(r => parseInt(String(r.application_no).replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    return 'AJS' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0');
  };

  const openAdd = () => { setF({ ...empty(), application_no: nextAppNo() }); setTab('new'); setEditId(null); setOldApp(''); setFound(null); setOpen(true); };
  const openEdit = r => {
    setF({ ...empty(), ...r,
      in_charge: (() => { let a = []; try { a = JSON.parse(r.in_charge || '[]'); } catch {} 
        return [a[0] || '', a[1] || '', a[2] || '']; })(),
      course_id: String(r.course_id || ''), dob: r.dob || '', joined_date: r.joined_date || today(),
      full_fees: String(r.full_fees || ''), offer_fees: String(r.offer_fees || '') });
    setTab('new'); setEditId(r.id); setOpen(true);
  };

  const findOld = () => {
    const s = rows.find(r => r.application_no === oldApp.trim());
    if (!s) return alert('Application number not found');
    setFound(s);
    setF({ ...f, application_no: nextAppNo(), course_id: String(s.course_id || ''),
      full_fees: String(s.full_fees || ''), offer_fees: String(s.offer_fees || '') });
  };

  const save = async () => {
    if (!f.name || !f.mobile || !f.application_no) return alert('Application No, Name & Mobile required');
    const payload = { ...f,
      in_charge: JSON.stringify(f.in_charge.filter(Boolean)),
      course_id: f.course_id || null,
      full_fees: f.full_fees || 0, offer_fees: f.offer_fees || f.full_fees || 0 };
    if (tab === 'existing' && found && !editId) {
      const p = { ...found, ...payload, id: undefined, student_type: 'existing', joined_date: today() };
      delete p.id; delete p.course_name; delete p.duration_days;
      await api.post('/inst/students', p);
    } else if (editId) await api.put(`/inst/students/${editId}`, payload);
    else await api.post('/inst/students', payload);
    setOpen(false); load();
  };

    const complete = async r => {
    if (!window.confirm(`Mark ${r.name} as COMPLETED? Student will be moved to Alumni.`)) return;
    await api.post(`/inst/students/${r.id}/complete`); load();
  };
  const del = async r => {
    if (!window.confirm('Delete this student?')) return;
    await api.delete(`/inst/students/${r.id}`); load();
  };
  const pickCourse = cid => {
    const c = courses.find(x => String(x.id) === cid);
    setF({ ...f, course_id: cid, full_fees: c ? String(c.fees) : f.full_fees });
  };
  const setStaff = (i, v) => { const a = [...f.in_charge]; a[i] = v; setF({ ...f, in_charge: a }); };

  const staffSelect = (i, label) => (
    <F label={label}>
      <select value={f.in_charge[i]} onChange={e => setStaff(i, e.target.value)}>
        <option value="">-- None --</option>
        {trainers.map(t => <option key={t.id} value={t.name}>{t.name} ({t.staff_id})</option>)}
      </select>
    </F>
  );

  return (
    <div>
      <PageHead title="Students">
        <button className="btn" onClick={openAdd}>＋ Add Student</button>
      </PageHead>
      <DataTable pageSize={15} rows={rows} columns={[
        { key: 'sno', label: 'S.No', render: (r, i) => i },
        { key: 'application_no', label: 'Application No' },
        { key: 'name', label: 'Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'course', label: 'Course', render: r => billing.find(b => b.id === r.id)?.course_name || '-' },
        { key: 'balance', label: 'Balance Fees', render: r => {
            const b = balOf(r.id); const v = b ? b.balance : '-';
            return <span className={b && b.balance > 0 ? 'text-red' : 'text-green'}>{typeof v === 'number' ? inr(v) : v}</span>; } },
      ]} actions={r => (
        <>
          <button className="btn green sm" onClick={() => complete(r)}>✔ Complete</button>
          <button className="icon-btn gold" title="Edit" onClick={() => openEdit(r)}>✏️</button>
          <button className="icon-btn red" title="Delete" onClick={() => del(r)}>🗑</button>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Student' : 'Add Student'} width={720}>
        {!editId && (
          <div className="seg" style={{ marginBottom: 18 }}>
            <button type="button" className={tab === 'new' ? 'on' : ''} onClick={() => setTab('new')}>🆕 New Student</button>
            <button type="button" className={tab === 'existing' ? 'on' : ''} onClick={() => setTab('existing')}>🔁 Existing Student</button>
          </div>
        )}

        {tab === 'existing' && !editId && !found && (
          <div className="form-grid">
            <F label="Existing Application Number"><input value={oldApp} onChange={e => setOldApp(e.target.value)} placeholder="e.g. AJS0001" /></F>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn maroon" type="button" onClick={findOld}>Next →</button>
            </div>
          </div>
        )}

        {(tab === 'new' || editId || found) && (
          <>
            <div className="form-grid">
              <F label="Application Number"><input value={f.application_no} onChange={e => setF({ ...f, application_no: e.target.value })} /></F>
              <ImageUpload label="Photo" value={f.photo} onChange={v => setF({ ...f, photo: v })} round />
              <F label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></F>
              <F label="Father's Name"><input value={f.father_name} onChange={e => setF({ ...f, father_name: e.target.value })} /></F>
              <F label="Mother's Name"><input value={f.mother_name} onChange={e => setF({ ...f, mother_name: e.target.value })} /></F>
              <F label="Occupation"><input value={f.occupation} onChange={e => setF({ ...f, occupation: e.target.value })} /></F>
              <F label="Date of Birth"><input type="date" value={f.dob || ''} onChange={e => setF({ ...f, dob: e.target.value })} /></F>
              <F label="Gender">
                <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </F>
              <F label="Mobile"><input value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} /></F>
              <F label="Email"><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></F>
              <F label="Course">
                <select value={f.course_id} onChange={e => pickCourse(e.target.value)}>
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.duration_days}d)</option>)}
                </select>
              </F>
              <F label="Aadhar Number"><input value={f.aadhar} onChange={e => setF({ ...f, aadhar: e.target.value })} /></F>
              <F label="Qualification"><input value={f.qualification} onChange={e => setF({ ...f, qualification: e.target.value })} /></F>
              <F label="Timing / Batch"><input value={f.batch_timing} onChange={e => setF({ ...f, batch_timing: e.target.value })} placeholder="e.g. 10AM-12PM Batch-A" /></F>
              {staffSelect(0, 'In-charge Staff 1')}
              {staffSelect(1, 'In-charge Staff 2 (optional)')}
              {staffSelect(2, 'In-charge Staff 3 (optional)')}
              <F label="Full Fees (from course)"><input value={f.full_fees} onChange={e => setF({ ...f, full_fees: e.target.value })} /></F>
              <F label="Offer Fees"><input type="number" value={f.offer_fees} onChange={e => setF({ ...f, offer_fees: e.target.value })} /></F>
              <F label="Address" full><textarea value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></F>
            </div>
            <div className="form-actions">
              <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}