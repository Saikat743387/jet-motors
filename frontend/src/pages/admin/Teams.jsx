import { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminTable } from './Purchases';
import { inr } from '../../utils/format';

export default function AdminTeams() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/teams').then(({ data }) => setRows(data.teams));
  }, []);
  return (
    <AdminTable title="Teams / Referrals" headers={['User', 'Mobile', 'Invite', 'Team size', 'Commission']}>
      {rows.map((row) => (
        <tr key={row.userId} className="border-t border-line">
          <td className="px-4 py-3">{row.userId}</td>
          <td className="px-4 py-3">{row.mobile}</td>
          <td className="px-4 py-3">{row.inviteCode}</td>
          <td className="px-4 py-3">{row.teamSize}</td>
          <td className="px-4 py-3">{inr(row.totalCommission)}</td>
        </tr>
      ))}
    </AdminTable>
  );
}
