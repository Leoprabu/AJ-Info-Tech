import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, PageHead } from '../../components/ui';
import { today } from '../../utils';

const SOURCES = ['Walk-in', 'Mobile', 'Google', 'Social Media', 'Website', 'Reference'];

export default function EnquiryPage({ title, endpoint, withCompany, withProject, withCourse }) {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const empty = { enquiry_date: today(), company_name: '', name: '', mobile: '', course: '', project: '',
    source: 'Walk-in', ref_name: '', follow_up_date: '', status: 'new', remark: '' };
  const [f, setF] = useState(empty);

  const load = async () => {
    const r = await api.get(`/${endpoint}`);
    setRows(r.data);
    if (withCourse) {
      const c = await api.get('/inst/courses');
      setCourses(c.data.filter(x => x.status === 'active'));
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const openAdd = () => { setF(empty); setEditId(null); setOpen(true); };
  const openEdit = r => { setF({ ...empty, ...r }); setEditId(r.id); setOpen(true); };
  const save = async () => {
    if (!f.name || !f.mobile) return alert('Name and Mobile are required');
    if (editId) await api.put(`/${endpoint}/${editId}`, f);
    else await api.post(`/${endpoint}`, f);
    setOpen(false); load();
  };
  const del = async r => { if (window.confirm('Delete this enquiry?')) { await api.delete(`/${endpoint}/${r.id}`); load(); } };
  const convert = async r => {
    if (!window.confirm('Convert this enquiry?')) return;
    await api.post(`/${endpoint}/${r.id}/convert`); load();
  };

  const columns = [
    { key: 'sno', label: '#', render: (r, i) => i },
    { key: 'enquiry_date', label: 'Enquiry Date' },
    ...(withCompany ? [{ key: 'company_name', label: 'Company Name' }] : []),
    { key: 'name', label: 'Name' },
    { key: 'mobile', label: 'Mobile' },
    ...(withCourse ? [{ key: 'course', label: 'Course' }] : []),
    ...(withProject ? [{ key: 'project', label: 'Project' }] : []),
    { key: 'follow_up_date', label: 'Follow-up Date' },
    { key: 'status', label: 'Status', render: r => (
      <span className={`pill ${r.converted ? 'pill-green' : r.status === 'follow-up' ? 'pill-gold' : 'pill-maroon'}`}>
        {r.converted ? 'Converted' : r.status}</span>) },
  ];

  return (
    <div>
      <PageHead title={title}>
        <button className="btn" onClick={openAdd}>＋ Add New</button>
      </PageHead>
      <DataTable columns={columns} rows={rows} actions={r => r.converted ? (
        <button className="btn green sm" disabled>✔ Joined</button>
      ) : (
        <>
          <button className="btn sm" onClick={() => convert(r)}>Convert</button>
          <button className="icon-btn gold" title="Edit" onClick={() => openEdit(r)}>✏️</button>
          <button className="icon-btn red" title="Delete" onClick={() => del(r)}>🗑</button>
        </>
      )} />

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Enquiry' : 'New Enquiry'} width={620}>
        <div className="form-grid">
          <F label="Enquiry Date"><input type="date" value={f.enquiry_date} onChange={e => setF({ ...f, enquiry_date: e.target.value })} /></F>
          {withCompany && <F label="Company Name"><input value={f.company_name} onChange={e => setF({ ...f, company_name: e.target.value })} /></F>}
          <F label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></F>
          <F label="Mobile"><input value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} /></F>
          {withCourse && (
            <F label="Course">
              <select value={f.course} onChange={e => setF({ ...f, course: e.target.value })}>
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c.id} value={c.course_name}>{c.course_name}</option>)}
              </select>
            </F>
          )}
          {withProject && <F label="Project"><input value={f.project} onChange={e => setF({ ...f, project: e.target.value })} /></F>}
          <F label="Source">
            <select value={f.source} onChange={e => setF({ ...f, source: e.target.value, ref_name: '' })}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          {f.source === 'Reference' && <F label="Reference Name"><input value={f.ref_name} onChange={e => setF({ ...f, ref_name: e.target.value })} /></F>}
          <F label="Next Follow-up Date"><input type="date" value={f.follow_up_date || ''} onChange={e => setF({ ...f, follow_up_date: e.target.value })} /></F>
          <F label="Status">
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              <option value="new">New</option><option value="follow-up">Follow-up</option><option value="converted">Converted</option>
            </select>
          </F>
          <F label="Remark (optional)" full><textarea value={f.remark || ''} onChange={e => setF({ ...f, remark: e.target.value })} /></F>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </Modal>
    </div>
  );
}