import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';
import { Card, EmptyRow, Field, FilterBar, GhostBtn, Loading, Modal, PageTitle, PrimaryBtn, TableShell, Td, TextInput, Th, Tabs } from './AdminUI';

const tabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

export default function AdminWithdrawals() {
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async (st = tab) => {
    setRows(null);
    const { data } = await api.get('/admin/withdrawals', { params: { status: st || undefined } });
    const populated = st
      ? data.withdrawals
      : data.withdrawals.sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
    setRows(populated);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(id) {
    setDetail(null);
    const { data } = await api.get(`/admin/withdrawals/${id}`);
    setDetail(data.withdrawal);
    setReason(data.withdrawal.adminNote || '');
  }

  async function update(id, status) {
    setBusy(`${id}:${status}`);
    try {
      await api.patch(`/admin/withdrawals/${id}`, { status, adminNote: status === 'rejected' ? reason : reason || undefined });
      toast.success(`Withdrawal ${status}`);
      setDetail(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBusy('');
    }
  }

  const pendingCount = rows ? rows.filter((r) => r.status === 'pending').length : 0;

  return (
    <div className="space-y-5">
      <PageTitle
        title="Withdrawals"
        subtitle="Approve, reject or complete withdrawal requests"
        actions={
          tab === 'pending' && rows ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {pendingCount} pending
            </span>
          ) : null
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={(v) => { setTab(v); }} />

      <div className="premium-card rounded-2xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment">
            <tr>
              <Th>Withdrawal ID</Th>
              <Th>User ID</Th>
              <Th>Mobile</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Requested</Th>
              <Th>Processed</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows ? (
              <tr><td colSpan={8}><Loading /></td></tr>
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={8} message="No withdrawals found" />
            ) : (
              rows.map((row) => {
                const isPending = row.status === 'pending';
                return (
                  <tr key={row._id} className={`${isPending ? 'bg-amber-50/70' : ''} hover:bg-parchment/50`}>
                    <Td className="text-xs font-mono text-muted">{row.withdrawalId}</Td>
                    <Td className="font-semibold text-burgundy">{row.userId?.userId}</Td>
                    <Td>{row.userId?.mobile}</Td>
                    <Td className="font-semibold">{inr(row.amount)}</Td>
                    <Td><StatusBadge status={row.status} /></Td>
                    <Td className="text-muted">{formatDate(row.createdAt)}</Td>
                    <Td className="text-muted">{row.processedAt ? formatDate(row.processedAt) : '—'}</Td>
                    <Td className="text-right">
                      <PrimaryBtn className="px-3 py-1 text-xs" onClick={() => openDetail(row._id)}>
                        View
                      </PrimaryBtn>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? detail.withdrawalId : 'Withdrawal'}>
        {detail ? (
          <div className="space-y-5 text-sm">
            <Card title="Bank details" subtitle="Loaded from the user's saved bank account">
              <table className="w-full text-left">
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-2 text-muted">Account holder</td>
                    <td className="py-2 font-semibold">{detail.bankAccount?.holderName || detail.bankSnapshot?.holderName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted">Account number</td>
                    <td className="py-2 font-semibold tracking-wide">{detail.bankAccount?.accountNumber || detail.bankSnapshot?.accountNumberMasked || '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted">IFSC code</td>
                    <td className="py-2 font-semibold uppercase">{detail.bankAccount?.ifscCode || detail.bankSnapshot?.ifscCode || '—'}</td>
                  </tr>
                  {detail.bankAccount ? (
                    <tr>
                      <td className="py-2 text-muted">Bank verified</td>
                      <td className="py-2">{detail.bankAccount.isVerified ? 'Yes' : 'No'}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Card>

            <Card title="Request summary">
              <table className="w-full text-left">
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-2 text-muted">User ID</td>
                    <td className="py-2 font-semibold">{detail.user?.userId}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted">Mobile</td>
                    <td className="py-2">{detail.user?.mobile}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted">Withdrawal amount</td>
                    <td className="py-2 font-semibold">{inr(detail.amount)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted">Status</td>
                    <td className="py-2"><StatusBadge status={detail.status} /></td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted">Requested</td>
                    <td className="py-2">{formatDate(detail.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted">Processed</td>
                    <td className="py-2">{detail.processedAt ? formatDate(detail.processedAt) : '—'}</td>
                  </tr>
                  {detail.adminNote ? (
                    <tr>
                      <td className="py-2 text-muted">Admin note</td>
                      <td className="py-2">{detail.adminNote}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Card>

            {detail.status !== 'completed' && detail.status !== 'rejected' ? (
              <div className="space-y-3">
                <Field label="Admin note / rejection reason">
                  <TextInput value={reason} onChange={setReason} placeholder="Optional note shown to user" />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <PrimaryBtn onClick={() => update(detail._id, 'approved')} disabled={busy === `${detail._id}:approved`}>
                    {busy === `${detail._id}:approved` ? '…' : 'Approve'}
                  </PrimaryBtn>
                  <GhostBtn onClick={() => update(detail._id, 'processing')} disabled={busy === `${detail._id}:processing`}>
                    {busy === `${detail._id}:processing` ? '…' : 'Mark Processing'}
                  </GhostBtn>
                  <PrimaryBtn className="bg-emerald-700 hover:bg-emerald-800" onClick={() => update(detail._id, 'completed')} disabled={busy === `${detail._id}:completed`}>
                    {busy === `${detail._id}:completed` ? '…' : 'Mark Completed'}
                  </PrimaryBtn>
                  <GhostBtn
                    className="border-rose-300 text-rose-700 hover:bg-rose-50"
                    onClick={() => update(detail._id, 'rejected')}
                    disabled={busy === `${detail._id}:rejected`}
                  >
                    {busy === `${detail._id}:rejected` ? '…' : 'Reject'}
                  </GhostBtn>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <Loading />
        )}
      </Modal>
    </div>
  );
}