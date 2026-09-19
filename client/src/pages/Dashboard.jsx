import React, { useEffect, useState } from 'react';
import api from '../api';
import { StatCard, BarChart } from '../components/ui';
import { inr } from '../utils';

export default function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/dashboard/stats').then(r => setS(r.data)).catch(() => {}); }, []);
  if (!s) return <div className="loading">Loading dashboard…</div>;
  return (
    <div>
      <div className="page-head"><h2>Dashboard</h2></div>

      <h3 className="row-head">🏫 Institute</h3>
      <div className="grid-4">
        <StatCard icon="🎓" label="Active / Total Students" value={s.inst.active} sub={`Total: ${s.inst.total}`} />
        <StatCard icon="🆕" label="Today / Month Admission" value={s.inst.today} sub={`This Month: ${s.inst.month}`} />
        <StatCard icon="👨‍🏫" label="Active Trainers" value={s.inst.activeTrainers} />
        <StatCard icon="🕐" label="Active Batches" value={s.inst.activeBatches} />
        <StatCard icon="⚠️" label="Outstanding Fees" value={inr(s.inst.outstanding)} tone="gold" />
        <StatCard icon="💵" label="Collection Today" value={inr(s.inst.colToday)} />
        <StatCard icon="📅" label="Collection of Month" value={inr(s.inst.colMonth)} />
        <StatCard icon="🧾" label="Today / Month Expenses" value={inr(s.inst.expToday)} sub={`Month: ${inr(s.inst.expMonth)}`} />
      </div>

      <h3 className="row-head">💻 IT Solutions</h3>
      <div className="grid-4">
        <StatCard icon="🏢" label="Active / Total Clients" value={s.it.activeClients} sub={`Total: ${s.it.totalClients}`} />
        <StatCard icon="📁" label="Active / Total Projects" value={s.it.activeProjects} sub={`Total: ${s.it.totalProjects}`} />
        <StatCard icon="🧑‍💻" label="Active / Total Employees" value={s.it.activeEmployees} sub={`Total: ${s.it.totalEmployees}`} />
        <StatCard icon="💰" label="This Month Income" value={inr(s.it.monthIncome)} tone="gold" />
      </div>

      <h3 className="row-head">📈 Analytics — Year Map</h3>
      <div className="grid-4">
        <BarChart title="Institute Income (Year)" data={s.charts.instIncome} money />
        <BarChart title="IT Solutions Income (Year)" data={s.charts.itIncome} color="var(--gold)" money />
        <BarChart title="Monthly Student Joins" data={s.charts.joins} color="var(--maroon-2)" />
        <BarChart title="Monthly Expenses" data={s.charts.expenses} color="#8a1538" money />
      </div>
    </div>
  );
}