import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Modal, DataTable, PageHead } from '../../components/ui';
import { fmtDate } from '../../utils';

export default function Alumni() {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState(null);
  useEffect(() => { api.get('/inst/alumni').then(r => setRows(r.data)); }, []);
  return (
    <div>
      <PageHead title="Alumni" />
      <DataTable rows={rows} columns={[
        { key: 'application_no', label: 'Student ID (Application No)' },
        { key: 'name', label: 'Name' },
        { key: 'course', label: 'Completed Course' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'joined_date', label: 'Joined Date', render: r => fmtDate(r.joined_date) },
        { key: 'completed_date', label: 'Completed Date', render: r => fmtDate(r.completed_date) },
      ]} actions={r => <button className="icon-btn" title="View" onClick={() => setView(r)}>👁</button>} />
      <Modal open={!!view} onClose={() => setView(null)} title={`Alumni — ${view?.name || ''}`} width={520}>
        {view && (
          <div className="user-row">
            <p><b>Application No:</b> {view.application_no}</p><p><b>Name:</b> {view.name}</p>
            <p><b>Course:</b> {view.course}</p><p><b>Mobile:</b> {view.mobile}</p>
            <p><b>Joined:</b> {fmtDate(view.joined_date)}</p><p><b>Completed:</b> {fmtDate(view.completed_date)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}