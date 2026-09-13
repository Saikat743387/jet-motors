import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { inr } from '../utils/format';

export default function Withdrawal() {
  const { user, refresh, settings } = useAuth();
  const navigate = useNavigate();
  const [bank, setBank] = useState(undefined);
  const [form, setForm] = useState({ holderName: '', accountNumber: '', ifscCode: '' });
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadBank() {
    const { data } = await api.get('/withdrawals/bank');
    setBank(data.bank);
    setEditing(!data.bank);
  }

  useEffect(() => {
    loadBank().catch(() => setBank(null));
  }, []);

  async function saveBank(e) {
    e.preventDefault();
    if (!form.holderName || !form.accountNumber || !form.ifscCode) {
      return toast.error('All bank fields are required');
    }
    setBusy(true);
    try {
      const { data } = await api.post('/withdrawals/bank', form);
      setBank(data.bank);
      setEditing(false);
      toast.success('Bank Account Added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save bank account');
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/withdrawals', { amount: Number(amount) });
      await refresh();
      setAmount('');
      toast.success('Withdrawal Submitted');
      navigate('/withdrawal-history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setBusy(false);
    }
  }

  if (bank === undefined) return <p className="text-muted">Loading…</p>;

  if (!bank || editing) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-4xl">Withdrawal</h1>
        <form onSubmit={saveBank} className="premium-card mt-5 rounded-2xl p-5">
          <h2 className="font-display text-2xl">Add Bank Account</h2>
          <Field label="Bank Holder Name" value={form.holderName} onChange={(v) => setForm({ ...form, holderName: v })} />
          <Field
            label="Account Number"
            value={form.accountNumber}
            onChange={(v) => setForm({ ...form, accountNumber: v.replace(/\D/g, '') })}
          />
          <Field
            label="IFSC Code"
            value={form.ifscCode}
            onChange={(v) => setForm({ ...form, ifscCode: v.toUpperCase() })}
          />
          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full rounded-xl py-3 font-semibold">
            SAVE BANK ACCOUNT
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="font-display text-4xl">Withdrawal</h1>
      <div className="premium-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted">Available Balance</p>
        <p className="font-display text-4xl text-burgundy">{inr(user?.balance)}</p>
        <p className="mt-1 text-xs text-muted">Minimum withdrawal {inr(settings?.minWithdrawal || 100)}</p>
      </div>
      <div className="premium-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Bank Account</h2>
          <span className="text-sm text-emerald-700">Added ✓</span>
        </div>
        <Row label="Account Holder" value={bank.holderName} />
        <Row label="Account Number" value={bank.accountNumberMasked} />
        <Row label="IFSC" value={bank.ifscCode} />
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-burgundy"
          onClick={() => setEditing(true)}
        >
          EDIT BANK ACCOUNT
        </button>
      </div>
      <form onSubmit={withdraw} className="premium-card rounded-2xl p-5">
        <label className="block text-sm font-medium">
          Withdrawal Amount
          <input
            className="mt-1 w-full rounded-xl border border-line bg-ivory px-3 py-2.5 text-ink placeholder:text-muted outline-none focus:border-gold"
            placeholder="₹"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full rounded-xl py-3 font-semibold">
          WITHDRAW
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="mt-4 block text-sm font-medium">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-line bg-ivory px-3 py-2.5 text-ink placeholder:text-muted outline-none focus:border-gold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="mt-3 flex items-center justify-between border-b border-line py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
