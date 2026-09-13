import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';
import { EmptyRow, Loading, Modal, PageTitle, PrimaryBtn, GhostBtn, Tabs, Th, Td, Field, TextInput } from './AdminUI';

const tabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminDeposits() {
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async (st = tab) => {
    setRows(null);
    const { data } = await api.get('/admin/deposits', { params: { status: st || undefined } });
    setRows(data.deposits);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function confirm(id) {
    if (!window.confirm('Confirm this deposit? Balance will be credited exactly once.')) return;
    setBusy(`${id}:success`);
    try {
      await api.post(`/admin/deposits/${id}/confirm`);
      toast.success('Deposit confirmed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirm failed');
    } finally { setBusy(''); }
  }

  async function updateStatus(id, status) {
    const labels = { rejected: 'Reject', failed: 'Mark Failed', cancelled: 'Cancel' };
    if (!window.confirm(`${labels[status] || status} this deposit? This cannot be undone.`)) return;
    setBusy(`${id}:${status}`);
    try {
      await api.patch(`/admin/deposits/${id}`, { status, adminNote: note || undefined });
      toast.success(`Deposit ${status}`);
      setNote('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setBusy(''); }
  }

  const pendingCount = rows ? rows.filter((r) => r.status === 'pending').length : 0;

  return (
    <div className="space-y-5">
      <PageTitle
        title="Deposits"
        subtitle="Confirm deposits to credit balance once; reject/failed/cancelled never credit"
        actions={tab === 'pending' && rows ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{pendingCount} pending</span>
        ) : null}
      />
      <Tabs tabs={tabs} active={tab} onChange={(v) => setTab(v)} />
      {tab === 'pending' ? (
        <div className="premium-card rounded-2xl p-4">
          <Field label="Admin note for reject/failed/cancel (optional)">
            <TextInput value={note} onChange={setNote} placeholder="Reason shown in audit log" />
          </Field>
        </div>
      ) : null}
      <div className="premium-card rounded-2xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment">
            <tr>
              <Th>User</Th>
              <Th>Txn</Th>
              <Th>Amount</Th>
              <Th>Product</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows ? (
              <tr><td colSpan={7}><Loading /></td></tr>
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={7} message="No deposits found" />
            ) : rows.map((row) => {
              const isPending = row.status === 'pending';
              return (
                <tr key={row._id} className={`${isPending ? 'bg-amber-50/70' : ''} hover:bg-parchment/50`}>
                  <td className="px-4 py-3 font-semibold text-burgundy">{row.userId?.userId || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{row.transactionId}</td>
                  <td className="px-4 py-3 font-semibold">{inr(row.amount)}</td>
                  <td className="px-4 py-3">{row.productId?.name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-muted">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <div className="flex flex-wrap gap-2">
                        <PrimaryBtn className="px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-800" onClick={() => confirm(row._id)} disabled={busy === `${row._id}:success`}>
                          {busy === `${row._id}:success` ? '…' : 'Confirm'}
                        </PrimaryBtn>
                        <GhostBtn className="px-3 py-1 text-xs border-rose-300 text-rose-700 hover:bg-rose-50" onClick={() => updateStatus(row._id, 'rejected')} disabled={busy.startsWith(`${row._id}:`)}>
                          {busy === `${row._id}:rejected` ? '…' : 'Reject'}
                        </GhostBtn>
                        <GhostBtn className="px-3 py-1 text-xs" onClick={() => updateStatus(row._id, 'failed')} disabled={busy.startsWith(`${row._id}:`)}>
                          {busy === `${row._id}:failed` ? '…' : 'Failed'}
                        </GhostBtn>
                        <GhostBtn className="px-3 py-1 text-xs" onClick={() => updateStatus(row._id, 'cancelled')} disabled={busy.startsWith(`${row._id}:`)}>
                          {busy === `${row._id}:cancelled` ? '…' : 'Cancel'}
                        </GhostBtn>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
