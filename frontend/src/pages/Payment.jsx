import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await api.post(`/deposits/${id}/simulate`, { paymentReference: `UPI-${Date.now()}` });
      await refresh();
      toast.success('Payment verified');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    try {
      await api.post(`/deposits/${id}/cancel`, { status: 'cancelled' });
      toast('Deposit cancelled');
      navigate('/deposit');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="font-display text-4xl">Payment</h1>
      <div className="premium-card rounded-2xl p-6">
        <p className="text-sm text-muted">
          This sandbox confirms payment on the server. Balance and product activation are never
          credited from a frontend “success” flag.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-gold bg-parchment px-4 py-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-deep">UPI / Gateway Placeholder</p>
          <p className="mt-2 font-display text-3xl">Complete Payment</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          className="btn-primary mt-5 w-full rounded-xl py-3 font-semibold"
        >
          {busy ? 'Verifying…' : 'Simulate Successful Payment'}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="mt-3 w-full rounded-xl border border-line py-3 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
