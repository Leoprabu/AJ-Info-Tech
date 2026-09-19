import React, { useEffect, useState } from 'react';
import api from '../../api';
import { DataTable, PageHead, StatCard } from '../../components/ui';
import { inr, fmtDate } from '../../utils';

export default function Accounts() {
  const [sum, setSum] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = async m => {
    const [y, mo] = m.split('-');
    const from = `${m}-01`;
    const to = new Date(y, mo, 0).toISOString().slice(0, 10);   // last day of month
    setSum((await api.get(`/finance/summary?from=${from}&to=${to}`)).data);
  };
  useEffect(() => { load(month); }, [month]);

  if (!sum) return <div className="loading">Loading accounts…</div>;
  return (
    <div>
      <PageHead title="Accounts">
        <input type="month" className="input" style={{ width: 180 }} value={month}
          onChange={e => setMonth(e.target.value)} />
      </PageHead>

      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <StatCard icon="💰" label="Total Income (Fee + IT + Other)" value={inr(sum.totalIncome)} />
        <StatCard icon="🧾" label="Total Expenses" value={inr(sum.expenses)} tone="gold" />
        <StatCard icon="🏦" label="Net Balance" value={inr(sum.net)} />
      </div>

      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginTop: 4 }}>
        <StatCard icon="🎓" label="Institute Collection" value={inr(sum.instIncome)} />
        <StatCard icon="💻" label="IT Solutions Income" value={inr(sum.itIncome)} />
        <StatCard icon="📌" label="Other Income" value={inr(sum.otherIncome)} />
        <StatCard icon="📉" label="Expenses" value={inr(sum.expenses)} tone="gold" />
      </div>

      <h3 className="row-head" style={{ marginTop: 26 }}>📖 Day Book — {month}</h3>
      <DataTable rows={sum.rows} columns={[
        { key: 'd', label: 'Date', render: r => fmtDate(r.d) },
        { key: 'type', label: 'Type', render: r => (
          <span className={`pill ${r.type === 'Expense' ? 'pill-red' : 'pill-green'}`}>{r.type}</span>) },
        { key: 'detail', label: 'Particulars', render: r => r.detail || '-' },
        { key: 'v', label: 'Amount', render: r => (
          <b className={r.type === 'Expense' ? 'text-red' : 'text-green'}>
            {r.type === 'Expense' ? '−' : '+'} {inr(r.v)}</b>) },
      ]} />
    </div>
  );
}