import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { PageHead, downloadPDF } from '../../components/ui';
import { inr, today } from '../../utils';

export default function Reports() {
  const first = new Date(); first.setDate(1);
  const [from, setFrom] = useState(first.toISOString().slice(0, 10));
  const [to, setTo] = useState(today());
  const [sum, setSum] = useState(null);
  const ref = useRef();

  const load = async () => setSum((await api.get(`/finance/summary?from=${from}&to=${to}`)).data);
  useEffect(() => { load(); }, []); // eslint-disable-line

  const rows = sum ? [
    ['Institute Collection', sum.instIncome],
    ['IT Solutions Income', sum.itIncome],
    ['Other Income', sum.otherIncome],
    ['Total Income', sum.totalIncome],
    ['Total Expenses', sum.expenses],
    ['NET PROFIT', sum.net],
  ] : [];

  return (
    <div>
      <PageHead title="Report">
        <input type="date" className="input" style={{ width: 160 }} value={from} onChange={e => setFrom(e.target.value)} />
        <span className="muted">to</span>
        <input type="date" className="input" style={{ width: 160 }} value={to} onChange={e => setTo(e.target.value)} />
        <button className="btn maroon" onClick={load}>Apply</button>
        <button className="btn ghost" onClick={() => window.print()}>🖨️ Print</button>
        <button className="btn" onClick={() => downloadPDF(ref.current, 'finance-report.pdf')}>⬇️ PDF</button>
      </PageHead>

      <div className="print-area" ref={ref} style={{ maxWidth: 700, padding: '0 4px' }}>
        <h2 style={{ color: 'var(--maroon)', textAlign: 'center', marginBottom: 4 }}>AJ INFO TECH</h2>
        <p style={{ textAlign: 'center', color: 'var(--gold)', fontSize: 12, marginBottom: 4 }}>IT Solutions | Institute</p>
        <p style={{ textAlign: 'center', fontSize: 12, marginBottom: 16 }}>Finance Report — <b>{from}</b> to <b>{to}</b></p>
        <table className="table" style={{ boxShadow: 'var(--shadow-sm)', borderRadius: 12, overflow: 'hidden' }}>
          <thead><tr><th>Particulars</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody>
            {rows.map(([l, v], i) => (
              <tr key={l} style={i >= 3 ? { background: i === 5 ? 'var(--maroon)' : 'rgba(212,160,23,.1)' } : {}}>
                <td style={{ fontWeight: i >= 3 ? 800 : 500, color: i === 5 ? '#fff' : 'inherit' }}>{l}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: i === 5 ? '#fff' : (i === 4 ? 'var(--red)' : i === 3 ? 'var(--green)' : 'inherit') }}>{inr(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sum && <p className="muted" style={{ marginTop: 10 }}>Transactions in period: {sum.rows.length}</p>}
      </div>
    </div>
  );
}