import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { History } from './Transactions';
import { formatDate, inr } from '../utils/format';

export default function WithdrawalHistory() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/withdrawals').then(({ data }) => setRows(data.withdrawals));
  }, []);

  return (
    <History title="Withdrawal History">
      {rows.length === 0 ? (
        <EmptyState title="No withdrawals yet" />
      ) : (
        rows.map((row) => (
          <div key={row._id} className="premium-card rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-3xl">{inr(row.amount)}</p>
                <p className="mt-1 text-xs text-muted">{row.withdrawalId}</p>
                <p className="text-xs text-muted">{row.bankSnapshot?.accountNumberMasked}</p>
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
