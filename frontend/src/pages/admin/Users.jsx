import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';
import { EmptyRow, Field, FilterBar, GhostBtn, Loading, PageTitle, PrimaryBtn, SelectInput, TableShell, Td, TextInput, Th } from './AdminUI';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [users, setUsers] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const limit = 20;

  const load = useCallback(async (p = page, search = q, st = status) => {
    setUsers(null);
    setError('');
    try {
      const params = { page: p, limit };
      if (search.trim()) params.q = search.trim();
      if (st) params.status = st;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total ?? data.users.length);
      setPage(data.page ?? p);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
    }
  }, [page, q, status]);

  useEffect(() => { load(1, q, status); }, []); // initial

  useEffect(() => { load(1, q, status); }, [status]);

  async function handleSearch() {
    setPage(1);
    await load(1, q, status);
  }

  function handleClear() {
    setQ('');
    setStatus('');
    setPage(1);
    load(1, '', '');
  }

  async function toggle(id) {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      toast.success('User status updated');
      load(page, q, status);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <PageTitle title="Users" subtitle={`Search, filter and manage all registered users — ${total} total`} />

      <FilterBar>
        <Field label="Search">
          <TextInput
            value={q}
            onChange={setQ}
            placeholder="User ID, mobile, referral code"
            className="min-w-56"
          />
        </Field>
        <Field label="Status">
          <SelectInput value={status} onChange={setStatus} options={statusOptions} />
        </Field>
        <GhostBtn onClick={handleClear} className="mr-1">Clear</GhostBtn>
        <PrimaryBtn onClick={handleSearch}>Search</PrimaryBtn>
      </FilterBar>

      {error ? <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="premium-card rounded-2xl">
        <TableShell>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-parchment">
              <tr>
                <Th>User ID</Th>
                <Th>Mobile</Th>
                <Th>Joined</Th>
                <Th>Balance</Th>
                <Th>Invite Code</Th>
                <Th>Referred By</Th>
                <Th>Purchases</Th>
                <Th>Bought Amt</Th>
                <Th>Withdrawals</Th>
                <Th>Withdrawn Amt</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!users ? (
                <tr><td colSpan={12}><Loading /></td></tr>
              ) : users.length === 0 ? (
                <EmptyRow colSpan={12} message={error ? error : 'No users found'} />
              ) : users.map((u) => (
                <tr key={u._id} className="cursor-pointer hover:bg-parchment/50" onClick={() => navigate(`/admin/users/${u._id}`)}>
                  <Td className="font-semibold text-burgundy">{u.userId}</Td>
                  <Td>{u.mobile}</Td>
                  <Td className="text-muted">{formatDate(u.createdAt)}</Td>
                  <Td className="font-semibold">{inr(u.balance)}</Td>
                  <Td><span className="rounded-md bg-parchment px-2 py-0.5 font-mono text-xs">{u.inviteCode}</span></Td>
                  <Td className="text-muted">{u.referredBy || '—'}</Td>
                  <Td>{u.totalPurchases ?? 0}</Td>
                  <Td>{inr(u.totalPurchaseAmount ?? 0)}</Td>
                  <Td>{u.withdrawalCount ?? 0}</Td>
                  <Td>{inr(u.totalWithdrawal ?? 0)}</Td>
                  <Td><StatusBadge status={u.status} /></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/admin/users/${u._id}`} className="font-semibold text-burgundy hover:underline" onClick={(e) => e.stopPropagation()}>View</Link>
                      <GhostBtn className="px-2 py-1 text-xs" onClick={(e) => { e.stopPropagation(); toggle(u._id); }}>{u.status === 'blocked' ? 'Unblock' : 'Block'}</GhostBtn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted">Page {page} of {totalPages} — {total} users</span>
          <div className="flex gap-2">
            <GhostBtn disabled={page <= 1} onClick={() => { const np = page - 1; setPage(np); load(np, q, status); }}>Prev</GhostBtn>
            <GhostBtn disabled={page >= totalPages} onClick={() => { const np = page + 1; setPage(np); load(np, q, status); }}>Next</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
