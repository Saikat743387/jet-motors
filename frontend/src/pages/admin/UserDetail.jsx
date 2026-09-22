import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';
import { Card, EmptyRow, Loading, PageTitle, StatCard, Td, Th, PrimaryBtn, GhostBtn, Modal, Field, TextInput } from './AdminUI';

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold capitalize text-ink">{value || '—'}</span>
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [adjType, setAdjType] = useState('credit');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [showAdj, setShowAdj] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editMobile, setEditMobile] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  async function load() {
    setError('');
    try {
      const { data: res } = await api.get(`/admin/users/${id}`);
      setData(res);
      setEditMobile(res.user.mobile);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user');
    }
  }

  useEffect(() => { load(); }, [id]);

  async function toggle() {
    setBusy('toggle');
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      toast.success('User status updated');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setBusy(''); }
  }

  async function saveEdit() {
    setBusy('edit');
    try {
      await api.patch(`/admin/users/${id}`, { mobile: editMobile.trim() });
      toast.success('User updated');
      setShowEdit(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setBusy(''); }
  }

  async function adjust() {
    const amt = Number(adjAmount);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error('Enter valid amount');
    if (!window.confirm(`${adjType === 'credit' ? 'Credit' : 'Debit'} ${inr(amt)} ${adjType === 'credit' ? 'to' : 'from'} ${data.user.userId}?`)) return;
    setBusy('adj');
    try {
      await api.post(`/admin/users/${id}/adjust-balance`, { type: adjType, amount: amt, note: adjNote });
      toast.success(`Balance ${adjType}ed`);
      setShowAdj(false); setAdjAmount(''); setAdjNote('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Adjust failed'); }
    finally { setBusy(''); }
  }

  async function resetPwd() {
    if (!newPwd || newPwd.length < 6) return toast.error('Password must be at least 6 characters');
    if (!window.confirm(`Reset password for ${data.user.userId}?`)) return;
    setBusy('pwd');
    try {
      await api.post(`/admin/users/${id}/reset-password`, { newPassword: newPwd });
      toast.success('Password reset');
      setShowPwd(false); setNewPwd('');
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed'); }
    finally { setBusy(''); }
  }

  async function permanentDelete() {
    if (!data || deleteConfirm.trim() !== data.user.userId) {
      return toast.error('Type the user ID to confirm permanent deletion');
    }
    setBusy('delete');
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(`${data.user.userId} permanently deleted`);
      navigate('/admin/users');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setBusy(''); }
  }

  if (error) return <div className="premium-card rounded-2xl p-6 text-sm text-rose-700">{error}</div>;
  if (!data) return <Loading text="Loading user…" />;
  const { user, purchases = [], withdrawals = [], deposits = [] } = data;

  return (
    <div className="space-y-6">
      <PageTitle
        title={user.userId}
        subtitle={`Registered ${formatDate(user.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={user.status} />
            <GhostBtn onClick={toggle} disabled={busy === 'toggle'}>{user.status === 'blocked' ? 'Unblock' : 'Block'}</GhostBtn>
            <PrimaryBtn onClick={() => setShowAdj(true)}>Adjust Balance</PrimaryBtn>
            <GhostBtn onClick={() => setShowPwd(true)}>Reset Password</GhostBtn>
            <GhostBtn onClick={() => setShowEdit(true)}>Edit</GhostBtn>
            <GhostBtn className="border-rose-300 text-rose-700 hover:bg-rose-50" onClick={() => { setDeleteConfirm(''); setShowDelete(true); }}>Delete User</GhostBtn>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Current Balance" value={inr(user.balance)} tone="burgundy" />
        <StatCard label="Total Deposits" value={inr((user.totalDeposit || 0) + (user.signupBonus || 0))} tone="gold" />
        <StatCard label="Total Earnings" value={inr(user.totalEarnings)} tone="green" />
        <StatCard label="Total Withdrawals" value={inr(user.totalWithdrawal)} tone="rose" />
        <StatCard label="Total Purchases" value={user.totalPurchases} tone="sky" />
        <StatCard label="Purchase Amount" value={inr(user.totalPurchaseAmount)} tone="gold" />
        <StatCard label="Pending Withdrawal" value={inr(user.pendingWithdrawalAmount)} tone="amber" />
        <StatCard label="Completed Withdrawal" value={inr(user.completedWithdrawalAmount)} tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profile">
          <Row label="User ID" value={user.userId} />
          <Row label="Mobile" value={user.mobile} />
          <Row label="Registration date" value={formatDate(user.createdAt)} />
          <Row label="Invite / Referral code" value={user.inviteCode} />
          <Row label="Referred by" value={user.referredBy ? `${user.referredBy.userId} (${user.referredBy.mobile})` : 'Direct signup'} />
          <Row label="Team size" value={user.teamSize} />
          <Row label="Status" value={user.status} />
        </Card>
        <Card title="Financial summary">
          <Row label="Total purchase amount" value={inr(user.totalPurchaseAmount)} />
          <Row label="Total earnings (commission)" value={inr(user.totalEarnings)} />
          <Row label="Total withdrawals" value={inr(user.totalWithdrawal)} />
          <Row label="Pending withdrawal amount" value={inr(user.pendingWithdrawalAmount)} />
          <Row label="Completed withdrawal amount" value={inr(user.completedWithdrawalAmount)} />
          <Row label="Total deposits" value={inr((user.totalDeposit || 0) + (user.signupBonus || 0))} />
          <Row label="Available balance" value={inr(user.balance)} />
        </Card>
      </div>

      <Card title={`Products purchased (${purchases.length})`} subtitle="Product name · price · purchase date · duration · daily income · total income">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead><tr><Th>Product</Th><Th>Price</Th><Th>Purchase date</Th><Th>Duration</Th><Th>Daily income</Th><Th>Total income</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-line">
              {purchases.length === 0 ? <EmptyRow colSpan={7} message="No purchases yet" /> : purchases.map((p) => (
                <tr key={p._id}><Td className="font-semibold">{p.productName}</Td><Td>{inr(p.price)}</Td><Td className="text-muted">{formatDate(p.createdAt)}</Td><Td>{p.durationDays}d</Td><Td>{inr(p.dailyIncome)}</Td><Td>{inr(p.totalIncome)}</Td><Td><StatusBadge status={p.status} /></Td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={`Withdrawals (${withdrawals.length})`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr><Th>Ref</Th><Th>Amount</Th><Th>Status</Th><Th>Requested</Th></tr></thead>
              <tbody className="divide-y divide-line">
                {withdrawals.length === 0 ? <EmptyRow colSpan={4} message="No withdrawals" /> : withdrawals.map((w) => (
                  <tr key={w._id}><Td className="text-xs text-muted">{w.withdrawalId}</Td><Td className="font-semibold">{inr(w.amount)}</Td><Td><StatusBadge status={w.status} /></Td><Td className="text-muted">{formatDate(w.createdAt)}</Td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title={`Deposits (${deposits.length})`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr><Th>Ref</Th><Th>Amount</Th><Th>Status</Th><Th>Requested</Th></tr></thead>
              <tbody className="divide-y divide-line">
                {deposits.length === 0 ? <EmptyRow colSpan={4} message="No deposits" /> : deposits.map((d) => (
                  <tr key={d._id}><Td className="text-xs text-muted">{d.transactionId}</Td><Td className="font-semibold">{inr(d.amount)}</Td><Td><StatusBadge status={d.status} /></Td><Td className="text-muted">{formatDate(d.createdAt)}</Td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={showAdj} onClose={() => setShowAdj(false)} title="Adjust Balance">
        <div className="space-y-3 text-sm">
          <Field label="Type"><select className="w-full rounded-lg border border-line bg-card px-3 py-2" value={adjType} onChange={(e) => setAdjType(e.target.value)}><option value="credit">Credit (add)</option><option value="debit">Debit (subtract)</option></select></Field>
          <Field label="Amount (₹)"><TextInput value={adjAmount} onChange={setAdjAmount} placeholder="100.00" /></Field>
          <Field label="Note (audit log)"><TextInput value={adjNote} onChange={setAdjNote} placeholder="Reason" /></Field>
          <div className="flex gap-2"><PrimaryBtn onClick={adjust} disabled={busy === 'adj'}>Confirm</PrimaryBtn><GhostBtn onClick={() => setShowAdj(false)}>Cancel</GhostBtn></div>
          <p className="text-xs text-muted">Creates a ledger Transaction and ActivityLog atomically. Debit validates balance.</p>
        </div>
      </Modal>

      <Modal open={showPwd} onClose={() => setShowPwd(false)} title="Reset Password">
        <div className="space-y-3 text-sm">
          <Field label="New Password (≥6 chars)"><TextInput value={newPwd} onChange={setNewPwd} placeholder="New password" /></Field>
          <div className="flex gap-2"><PrimaryBtn onClick={resetPwd} disabled={busy === 'pwd'}>Reset</PrimaryBtn><GhostBtn onClick={() => setShowPwd(false)}>Cancel</GhostBtn></div>
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit User">
        <div className="space-y-3 text-sm">
          <Field label="Mobile (10 digits, 6-9 start)"><TextInput value={editMobile} onChange={setEditMobile} placeholder={user.mobile} /></Field>
          <div className="flex gap-2"><PrimaryBtn onClick={saveEdit} disabled={busy === 'edit'}>Save</PrimaryBtn><GhostBtn onClick={() => setShowEdit(false)}>Cancel</GhostBtn></div>
        </div>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Permanently Delete User">
        <div className="space-y-3 text-sm">
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
            You are about to <strong>permanently delete</strong>{' '}
            <span className="font-semibold">{user.userId}</span> and <strong>all of their data</strong> —
            purchases, deposits, withdrawals, transactions, daily income claims, wallet/ledger records,
            referral/team records, bank details, tickets, and activity logs. This action{' '}
            <strong>cannot be undone</strong>.
          </p>
          <Field label={`Type ${user.userId} to confirm`}>
            <TextInput value={deleteConfirm} onChange={setDeleteConfirm} placeholder={user.userId} />
          </Field>
          <div className="flex gap-2">
            <PrimaryBtn
              className="bg-rose-700 hover:bg-rose-800"
              disabled={busy === 'delete' || deleteConfirm.trim() !== user.userId}
              onClick={permanentDelete}
            >
              {busy === 'delete' ? 'Deleting…' : 'Permanently Delete'}
            </PrimaryBtn>
            <GhostBtn onClick={() => setShowDelete(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
