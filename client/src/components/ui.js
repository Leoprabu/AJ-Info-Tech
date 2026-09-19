import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ---------- Modal ---------- */
export function Modal({ open, title, onClose, children, width = 580 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" style={{ maxWidth: width }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3>
          <button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Form field wrapper ---------- */
export const F = ({ label, children, full }) => (
  <label className={`field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>
);

/* ---------- Data table: search + pagination ---------- */
export function DataTable({ columns, rows, pageSize = 15, actions, empty = 'No records found' }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const f = rows.filter(r => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(f.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = f.slice((cur - 1) * pageSize, cur * pageSize);
  return (
    <div className="table-wrap">
      <div className="table-toolbar">
        <input className="input search" placeholder="🔍  Search…" value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }} />
        <span className="muted">{f.length} record(s)</span>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead><tr>
            {columns.map(c => <th key={c.key}>{c.label}</th>)}
            {actions && <th style={{ width: 150 }}>Action</th>}
          </tr></thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={r.id || i}>
                {columns.map(c => <td key={c.key}>{c.render ? c.render(r, (cur - 1) * pageSize + i + 1) : (r[c.key] ?? '-')}</td>)}
                {actions && <td className="action-cell">{actions(r)}</td>}
              </tr>
            ))}
            {!slice.length && <tr><td className="empty" colSpan={columns.length + (actions ? 1 : 0)}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn ghost sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>‹ Prev</button>
        <span className="muted">Page {cur} of {pages}</span>
        <button className="btn ghost sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Next ›</button>
      </div>
    </div>
  );
}

/* ---------- Page heading ---------- */
export const PageHead = ({ title, children }) => (
  <div className="page-head"><h2>{title}</h2><div className="page-head-actions">{children}</div></div>
);

/* ---------- Stat card ---------- */
export const StatCard = ({ label, value, sub, icon, tone }) => (
  <div className={`stat-card ${tone || ''}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-txt">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

/* ---------- SVG Bar chart (no external lib) ---------- */
export function BarChart({ title, data = [], color = 'var(--maroon)', money }) {
  const max = Math.max(...data, 1);
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="chart-card">
      <h4>{title}</h4>
      <svg viewBox="0 0 300 145" className="chart-svg">
        <line x1="6" y1="110" x2="294" y2="110" stroke="rgba(0,0,0,.12)" />
        {data.map((v, i) => {
          const h = (v / max) * 95;
          return (
            <g key={i}>
              <title>{`${M[i]}: ${money ? '₹' + Number(v).toLocaleString('en-IN') : v}`}</title>
              <rect x={12 + i * 24} y={110 - h} width="16" height={h || 2} rx="4" fill={color} opacity={v ? 0.92 : 0.2} />
            </g>
          );
        })}
        {M.map((m, i) => (
          <text key={i} x={20 + i * 24} y={126} fontSize="8.5" textAnchor="middle" fill="#9a8f95">
            {m.slice(0, 1)}</text>
        ))}
      </svg>
    </div>
  );
}

/* ---------- Geometric corner emblem (receipts / invoices) ---------- */
export const CornerEmblem = ({ size = 74 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <polygon points="30,0 70,0 30,100" fill="#5e0b18" />
    <polygon points="70,0 70,100 30,100" fill="#d4a017" />
    <line x1="30" y1="100" x2="70" y2="0" stroke="#ffffff" strokeWidth="7" />
  </svg>
);

/* ---------- Image upload (base64) ---------- */
export function ImageUpload({ label, value, onChange, round }) {
  const ref = useRef();
  return (
    <div className="imgup">
      <span className="flabel">{label}</span>
      <div className="imgup-row">
        <div className={`imgup-preview ${round ? 'round' : ''}`} onClick={() => ref.current?.click()}>
          {value ? <img src={value} alt="" /> : <span>＋</span>}
        </div>
        <div className="imgup-btns">
          <input type="file" accept="image/*" hidden ref={ref} onChange={e => {
            const file = e.target.files[0]; if (!file) return;
            const rd = new FileReader(); rd.onload = () => onChange(rd.result); rd.readAsDataURL(file);
          }} />
          <button type="button" className="btn ghost sm" onClick={() => ref.current?.click()}>Upload</button>
          {!!value && <button type="button" className="btn ghost sm danger" onClick={() => onChange('')}>Remove</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- PDF download ---------- */
export async function downloadPDF(el, filename, format = [210, 297]) {
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
  const pdf = new jsPDF({ unit: 'mm', format });
  const w = pdf.internal.pageSize.getWidth();
  const h = Math.min(canvas.height * w / canvas.width, pdf.internal.pageSize.getHeight());
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
  pdf.save(filename);
}

/* ---------- Access denied ---------- */
export const AccessDenied = () => (
  <div className="access-denied">
    <div className="ad-icon">🔒</div>
    <h2>Access Denied</h2>
    <p>You do not have permission to view this module.<br />Contact the administrator.</p>
  </div>
);