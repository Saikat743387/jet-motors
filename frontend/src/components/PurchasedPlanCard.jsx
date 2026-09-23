import { useState } from 'react';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import { assetUrl, formatDate, inr } from '../utils/format';

export default function PurchasedPlanCard({ row, onClaimed }) {
  const [busy, setBusy] = useState(false);
  const claim = row.claim || {};
  const claimedDays = claim.claimedDays ?? row.claimedDays ?? 0;

  async function claimIncome() {
    setBusy(true);
    try {
      const { data } = await api.post(`/me/purchases/${row._id}/claim`);
      toast.success(`Daily income claimed: ${inr(data.claim.amount)}`);
      onClaimed?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not claim daily income');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="premium-card overflow-hidden rounded-2xl">
      <div className="flex gap-4 p-4">
        <img src={assetUrl(row.productImage)} alt="" className="h-20 w-24 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate font-display text-2xl">{row.productName}</h2>
            <StatusBadge status={row.status} />
          </div>
          <p className="text-sm text-muted">Purchase Price {inr(row.price)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-line px-4 py-4 text-sm">
        <Meta
          label="Duration"
          value={`${row.durationDays} Days`}
          valueClassName="text-[#15803D]"
          icon={<Clock size={14} className="text-[#2563EB]" aria-hidden="true" />}
        />
        <Meta label="Daily Income" value={inr(row.dailyIncome)} valueClassName="text-[#15803D]" />
        <Meta label="Total Income" value={inr(row.totalIncome)} valueClassName="text-[#15803D]" />
        <Meta label="Price" value={inr(row.price)} valueClassName="text-[#15803D]" />
        <Meta label="Start date" value={formatDate(row.startDate)} />
        <Meta label="End date" value={formatDate(row.endDate)} />
        <Meta label="Days claimed" value={`${claimedDays} of ${row.durationDays}`} />
        <Meta label="Last claim" value={claim.lastClaimDate ? formatDate(claim.lastClaimDate) : '—'} />
      </div>
      <div className="border-t border-line px-4 py-4">
        {claim.canClaim ? (
          <button
            type="button"
            disabled={busy}
            onClick={claimIncome}
            className="btn-primary w-full rounded-xl py-3 font-semibold disabled:opacity-60"
          >
            {busy ? 'Claiming…' : 'Claim Daily Income'}
          </button>
        ) : claim.reason === 'claimed_today' ? (
          <p className="rounded-xl bg-parchment py-3 text-center text-sm font-semibold text-burgundy">
            Claimed for today ✓
          </p>
        ) : (
          <p className="rounded-xl bg-ivory py-3 text-center text-sm font-semibold text-muted">
            {row.status === 'completed' || claim.reason === 'completed' ? 'Plan completed' : 'Claim not available'}
          </p>
        )}
      </div>
    </article>
  );
}

function Meta({ label, value, valueClassName = 'text-ink', icon = null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`font-semibold ${icon ? 'flex items-center gap-1' : ''} ${valueClassName}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}
