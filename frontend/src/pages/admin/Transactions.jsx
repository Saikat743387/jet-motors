import { useEffect, useState } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { AdminTable } from './Purchases';
import { formatDate, inr } from '../../utils/format';

export default function AdminTransactions() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/transactions').then(({ data }) => setRows(data.transactions));
  }, []);
  return (
    <AdminTable title="Transactions" headers={['User', 'Type', 'Amount', 'Status', 'Date']}>
      {rows.map((row) => (
        <tr key={row._id} className="border-t border-line">
          <td className="px-4 py-3">{row.userId?.userId}</td>
          <td className="px-4 py-3 capitalize">{row.type}</td>
          <td className="px-4 py-3">{inr(row.amount)}</td>
          <td className="px-4 py-3">
            <StatusBadge status={row.status} />
          </td>
          <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
        </tr>
      ))}
    </AdminTable>
  );
}
