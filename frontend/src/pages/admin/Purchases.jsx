import { useEffect, useState } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';

export default function AdminPurchases() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/purchases').then(({ data }) => setRows(data.purchases));
  }, []);

  return (
    <AdminTable title="Purchases">
      {rows.map((row) => (
        <tr key={row._id} className="border-t border-line">
          <td className="px-4 py-3">{row.userId?.userId}</td>
          <td className="px-4 py-3">{row.productName}</td>
          <td className="px-4 py-3">{inr(row.price)}</td>
          <td className="px-4 py-3">
            <StatusBadge status={row.status} />
          </td>
          <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
        </tr>
      ))}
    </AdminTable>
  );
}

export function AdminTable({ title, headers = ['User', 'Detail', 'Amount', 'Status', 'Date'], children }) {
  return (
    <div>
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-5 overflow-x-auto premium-card rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment text-xs uppercase tracking-wider text-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
