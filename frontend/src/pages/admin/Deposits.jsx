import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { AdminTable } from './Purchases';
import { formatDate, inr } from '../../utils/format';

export default function AdminDeposits() {
  const [rows, setRows] = useState([]);
  async function load() {
    const { data } = await api.get('/admin/deposits');
    setRows(data.deposits);
  }
  useEffect(() => {
    load();
  }, []);

  async function confirm(id) {
    try {
      await api.post(`/admin/deposits/${id}/confirm`);
      toast.success('Deposit confirmed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirm failed');
    }
  }

  return (
    <AdminTable title="Deposits" headers={['User', 'Txn', 'Amount', 'Status', 'Date', '']}>
      {rows.map((row) => (
        <tr key={row._id} className="border-t border-line">
          <td className="px-4 py-3">{row.userId?.userId}</td>
          <td className="px-4 py-3 text-xs">{row.transactionId}</td>
          <td className="px-4 py-3">{inr(row.amount)}</td>
          <td className="px-4 py-3">
            <StatusBadge status={row.status} />
          </td>
          <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
          <td className="px-4 py-3">
            {row.status === 'pending' ? (
              <button type="button" className="text-sm font-semibold text-burgundy" onClick={() => confirm(row._id)}>
                Confirm
              </button>
            ) : null}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
