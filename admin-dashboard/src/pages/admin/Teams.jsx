import { useEffect, useState } from 'react';
import api from '../../services/api';
import { inr } from '../../utils/format';
import { EmptyRow, Loading, PageTitle, TableShell, Td, Th } from './AdminUI';

export default function AdminTeams() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/admin/teams').then(({ data }) => setRows(data.teams));
  }, []);

  return (
    <div className="space-y-5">
      <PageTitle title="Teams / Referrals" subtitle="Referral team structure and commission earned per user" />

      <div className="premium-card rounded-2xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment">
            <tr>
              <Th>User ID</Th>
              <Th>Mobile</Th>
              <Th>Referral Code</Th>
              <Th>Team Size</Th>
              <Th>Level 1</Th>
              <Th>Level 2</Th>
              <Th>Level 3</Th>
              <Th>Commission Earned</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows ? (
              <tr><td colSpan={8}><Loading /></td></tr>
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={8} />
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="hover:bg-parchment/50">
                  <Td className="font-semibold text-burgundy">{row.userId}</Td>
                  <Td>{row.mobile}</Td>
                  <Td>
                    <span className="rounded-md bg-parchment px-2 py-0.5 font-mono text-xs">{row.inviteCode}</span>
                  </Td>
                  <Td className="font-semibold">{row.teamSize}</Td>
                  <Td>{row.level1}</Td>
                  <Td>{row.level2}</Td>
                  <Td>{row.level3}</Td>
                  <Td className="font-semibold">{inr(row.totalCommission)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}