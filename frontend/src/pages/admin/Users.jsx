import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { inr } from '../../utils/format';

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);

  async function load(search = q) {
    const { data } = await api.get('/admin/users', { params: { q: search } });
    setUsers(data.users);
  }

  useEffect(() => {
    load('');
  }, []);

  async function toggle(id) {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          className="flex-1 rounded-xl border border-line px-3 py-2.5"
          placeholder="Search mobile, user ID, invite code"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn-primary rounded-xl px-4 font-semibold">
          Search
        </button>
      </form>
      <div className="mt-4 overflow-x-auto premium-card rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold">{u.userId}</td>
                <td className="px-4 py-3">{u.mobile}</td>
                <td className="px-4 py-3">{inr(u.balance)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/users/${u.id}`} className="mr-3 text-burgundy">
                    View
                  </Link>
                  <button type="button" className="text-sm font-semibold" onClick={() => toggle(u.id)}>
                    {u.status === 'blocked' ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
