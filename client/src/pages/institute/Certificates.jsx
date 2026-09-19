import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, F, ImageUpload, PageHead } from '../../components/ui';
import { today, fmtDate } from '../../utils';

const empty = { certificate_no: '', name: '', course: '', certificate_image: '', completed_date: today() };

export default function Certificates() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [viewImg, setViewImg] = useState(null);
  const [issue, setIssue] = useState(null);
  const [issuedView, setIssuedView] = useState(null);
  const [iF, setIF] = useState({ receiver_name: '', receiver_mobile: '', issue_date: today() });

  const load = async () => {
    const [a, b] = await Promise.all([api.get('/inst/certificates'), api.get('/inst/courses')]);
    setRows(a.data); setCourses(b.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!f.certificate_no || !f.name) return alert('Certificate number & name required');
    await api.post('/inst/certificates', f);
    setOpen(false); setF(empty); load();
  };
  const doIssue = async () => {
    await api.put(`/inst/certificates/${issue.id}`, { issued: 1, ...iF });
    setIssue(null); load();
  };

  return (
    <div>
      <PageHead title="Certificates">
        <button className="btn" onClick={() => setOpen(true)}>＋ Add Certificate</button>
      </PageHead>
      <DataTable rows={rows} columns={[
        { key: 'sno', label: 'S.No', render: (r, i) => i },
        { key: 'certificate_no', label: 'Certificate No (App No)' },
        { key: 'name', label: 'Name' },
        { key: 'course', label: 'Course' },
        { key: 'completed_date', label: 'Complete Date', render: r => fmtDate(r.completed_date) },
        { key: 'certificate_image', label: 'Certificate', render: r => r.certificate_image
          ? <button className="btn ghost sm" onClick={() => setViewImg(r.certificate_image)}>👁 View</button> : <span className="muted">—</span> },
        { key: 'issued', label: 'Issue Status', render: r => (
          <span className={`pill ${r.issued ? 'pill-green' : 'pill-gold'}`}>{r.issued ? 'Issued' : 'Pending'}</span>) },
      ]} actions={r => r.issued ? (
        <button className="btn green sm" onClick={() => setIssuedView(r)}>Issued ✔</button>
      ) : (
        <button className="btn maroon sm" onClick={() => { setIssue(r); setIF({ receiver_name: r.name, receiver_mobile: '', issue_date: today() }); }}>Issue</button>
      )} />

      {/* Add */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Certificate">
        <div className="form-grid">
          <F label="Certificate Number (Application No)"><input value={f.certificate_no} onChange={e => setF({ ...f, certificate_no: e.target.value })} /></F>
          <F label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></F>
          <F label="Course">
            <select value={f.course} onChange={e => setF({ ...f, course: e.target.value })}>
              <option value="">-- Select --</option>
              {courses.map(c => <option key={c.id}>{c.course_name}</option>)}
            </select>
          </F>
          <F label="Complete Date"><input type="date" value={f.completed_date} onChange={e => setF({ ...f, completed_date: e.target.value })} /></F>
          <div className="full"><ImageUpload label="Certificate (image)" value={f.certificate_image} onChange={v => setF({ ...f, certificate_image: v })} /></div>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </Modal>

      {/* Issue modal */}
      <Modal open={!!issue} onClose={() => setIssue(null)} title="Issue Certificate" width={440}>
        <div className="form-grid">
          <F label="Receiver Name" full><input value={iF.receiver_name} onChange={e => setIF({ ...iF, receiver_name: e.target.value })} /></F>
          <F label="Mobile"><input value={iF.receiver_mobile} onChange={e => setIF({ ...iF, receiver_mobile: e.target.value })} /></F>
          <F label="Date"><input type="date" value={iF.issue_date} onChange={e => setIF({ ...iF, issue_date: e.target.value })} /></F>
        </div>
        <div className="form-actions"><button className="btn green" onClick={doIssue}>✔ Confirm Issue</button></div>
      </Modal>

      {/* Issued details */}
      <Modal open={!!issuedView} onClose={() => setIssuedView(null)} title="Issued Details" width={440}>
        {issuedView && (
          <div className="user-row">
            <b>Receiver:</b> {issuedView.receiver_name}<br />
            <b>Mobile:</b> {issuedView.receiver_mobile}<br />
            <b>Date:</b> {fmtDate(issuedView.issue_date)}
          </div>
        )}
      </Modal>

      {/* Certificate image viewer */}
      <Modal open={!!viewImg} onClose={() => setViewImg(null)} title="Certificate" width={760}>
        {viewImg && <img src={viewImg} alt="certificate" style={{ width: '100%', borderRadius: 12 }} />}
      </Modal>
    </div>
  );
}