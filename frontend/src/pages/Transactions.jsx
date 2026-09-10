import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { formatDate, inr } from '../utils/format';

export default function Transactions() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/me/transactions').then(({ data }) => setRows(data.transactions));
  }, []);

  return (
    <History title="Transactions">
      {rows.length === 0 ? (
        <EmptyState title="No transactions yet" />
      ) : (
        rows.map((row) => (
          <div key={row._id} className="premium-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">{row.transactionId}</p>
                <p className="mt-1 font-semibold capitalize">{row.type}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>{inr(row.amount)}</span>
              <span className="text-muted">{formatDate(row.createdAt)}</span>
            </div>
          </div>
        ))
      )}
    </History>
  );
}

export function History({ title, children }) {
  return (
    <div>
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}
