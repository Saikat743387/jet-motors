import { useEffect, useState } from 'react';
import api from '../../services/api';
import { inr } from '../../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <p className="text-muted">Loading dashboard…</p>;

  const cards = [
    ['Total Users', stats.totalUsers],
    ['Total Deposits', inr(stats.totalDeposits)],
    ['Total Withdrawals', inr(stats.totalWithdrawals)],
    ['Active Products', stats.activeProducts],
    ['Pending Withdrawals', stats.pendingWithdrawals],
    ['Pending Deposits', stats.pendingDeposits],
    ['Total Commissions', inr(stats.totalCommissions)],
  ];

  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="premium-card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
