import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, inr } from '../../utils/format';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/admin/users/${id}`).then(({ data: res }) => setData(res));
  }, [id]);

  if (!data) return <p className="text-muted">Loading…</p>;
  const { user } = data;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">{user.userId}</h1>
      <div className="premium-card rounded-2xl p-5 text-sm">
        <Row label="Mobile" value={user.mobile} />
        <Row label="Invite code" value={user.inviteCode} />
        <Row label="Balance" value={inr(user.balance)} />
        <Row label="Total deposit" value={inr(user.totalDeposit)} />
        <Row label="Total withdrawal" value={inr(user.totalWithdrawal)} />
        <Row label="Total commission" value={inr(user.totalCommission)} />
        <Row label="Team size" value={data.teamSize} />
        <Row label="Status" value={user.status} />
      </div>
      <Section title="Purchases" rows={data.purchases} render={(p) => `${p.productName} · ${inr(p.price)}`} />
      <Section title="Deposits" rows={data.deposits} render={(d) => `${inr(d.amount)} · ${d.status}`} />
      <Section title="Withdrawals" rows={data.withdrawals} render={(w) => `${inr(w.amount)} · ${w.status}`} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-line py-2">
      <span className="text-muted">{label}</span>
      <span className="font-semibold capitalize">{String(value)}</span>
    </div>
  );
}

function Section({ title, rows, render }) {
  return (
    <div className="premium-card rounded-2xl p-5">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 space-y-2 text-sm">
        {rows.length === 0 ? (
          <p className="text-muted">None</p>
        ) : (
          rows.map((row) => (
            <div key={row._id} className="flex justify-between border-b border-line py-2">
              <span>{render(row)}</span>
              <span className="text-muted">{formatDate(row.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
