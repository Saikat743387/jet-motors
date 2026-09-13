import { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminTable } from './Purchases';
import { formatDate, inr } from '../../utils/format';

export default function AdminCommissions() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/commissions').then(({ data }) => setRows(data.commissions));
  }, []);
  return (
    <AdminTable title="Commissions" headers={['User', 'From', 'Level', 'Amount', 'Date']}>
      {rows.map((row) => (
        <tr key={row._id} className="border-t border-line">
          <td className="px-4 py-3">{row.userId?.userId}</td>
          <td className="px-4 py-3">{row.fromUserId?.userId}</td>
          <td className="px-4 py-3">{row.level}</td>
          <td className="px-4 py-3">{inr(row.amount)}</td>
          <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
        </tr>
      ))}
    </AdminTable>
  );
}
