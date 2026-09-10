import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { History } from './Transactions';
import { formatDate, inr } from '../utils/format';

export default function RechargeHistory() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/deposits').then(({ data }) => setRows(data.deposits));
  }, []);

  return (
    <History title="Recharge History">
      {rows.length === 0 ? (
        <EmptyState title="No recharges yet" />
      ) : (
        rows.map((row) => (
          <div key={row._id} className="premium-card rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-3xl">{inr(row.amount)}</p>
                <p className="mt-1 text-xs text-muted">{row.transactionId}</p>
                {row.paymentReference ? (
                  <p className="text-xs text-muted">Ref: {row.paymentReference}</p>
                ) : null}
              </div>
              <StatusBadge status={row.status} />
            </div>
            <p className="mt-2 text-sm text-muted">{formatDate(row.createdAt)}</p>
          </div>
        ))
      )}
    </History>
  );
}
