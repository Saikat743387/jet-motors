import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate, inr } from '../../utils/format';
import { Card, Loading, PageTitle, StatCard } from './AdminUI';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <Loading text="Loading dashboard…" />;

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" subtitle="Overview of your JET MOTORS business" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} tone="burgundy" />
        <StatCard label="Active Users" value={stats.totalActiveUsers} tone="green" />
        <StatCard label="Total Deposits" value={inr(stats.totalDeposits)} tone="gold" />
        <StatCard label="Pending Deposits" value={stats.pendingDeposits ?? 0} tone="amber" />
        <StatCard label="Total Deposits Count" value={stats.totalDepositsCount ?? 0} tone="sky" />
        <StatCard label="Successful Deposits" value={stats.successfulDeposits ?? 0} tone="green" />
        <StatCard label="Total Withdrawals" value={inr(stats.totalWithdrawals)} tone="rose" />
        <StatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} tone="amber" />
        <StatCard label="Completed Withdrawals" value={stats.completedWithdrawals ?? 0} tone="green" />
        <StatCard label="Rejected Withdrawals" value={stats.rejectedWithdrawals ?? 0} tone="rose" />
        <StatCard label="Total Withdrawal Requests" value={stats.totalWithdrawalsCount ?? 0} tone="sky" />
        <StatCard label="Total Purchases" value={stats.totalProductPurchases} tone="sky" />
        <StatCard label="Purchase Amount" value={inr(stats.totalPurchaseAmount)} tone="burgundy" />
        <StatCard label="Total User Balance" value={inr(stats.totalUserBalance)} tone="gold" />
        <StatCard label="Today's New Users" value={stats.todayNewUsers} tone="green" />
        <StatCard label="Today's Purchases" value={stats.todayPurchases} tone="sky" />
        <StatCard label="Today's Withdrawals" value={stats.todayWithdrawals} tone="amber" />
        <StatCard label="Active Products" value={stats.activeProducts} tone="burgundy" />
        <StatCard label="Total Commissions" value={inr(stats.totalCommissions)} tone="gold" />
      </div>

      <Card title="Withdrawal Statistics" subtitle="Source: MongoDB withdrawals collection — backend is truth">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded-xl bg-parchment px-4 py-3"><p className="text-muted">Total Withdrawal Amount</p><p className="font-semibold">{inr(stats.totalWithdrawals)}</p></div>
          <div className="rounded-xl bg-parchment px-4 py-3"><p className="text-muted">Completed (count)</p><p className="font-semibold">{stats.completedWithdrawals ?? 0}</p></div>
          <div className="rounded-xl bg-parchment px-4 py-3"><p className="text-muted">Pending (count)</p><p className="font-semibold">{stats.pendingWithdrawals ?? 0}</p></div>
          <div className="rounded-xl bg-parchment px-4 py-3"><p className="text-muted">Rejected (count)</p><p className="font-semibold">{stats.rejectedWithdrawals ?? 0}</p></div>
        </div>
      </Card>

      <Card title="Recent Activity" subtitle="Latest system events">
        {stats.recentActivity?.length ? (
          <div className="divide-y divide-line text-sm">
            {stats.recentActivity.map((log) => (
              <div key={log._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <span className="font-semibold capitalize text-ink">{log.action.replace(/\./g, ' · ')}</span>
                  <span className="ml-2 text-xs normal-case text-muted">
                    {log.actorId?.userId || 'system'} · {log.targetType} {log.targetId}
                  </span>
                </div>
                <span className="text-xs text-muted">{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No recent activity</p>
        )}
      </Card>
    </div>
  );
}