import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
import api from '../services/api';
import { inr } from '../utils/format';

export default function Team() {
  const [team, setTeam] = useState(null);

  useEffect(() => {
    api.get('/team').then(({ data }) => setTeam(data));
  }, []);

  function copy(text, label) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  if (!team) return <p className="text-muted">Loading team…</p>;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Team</h1>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total Team Size" value={team.totalTeamSize} />
        <Stat label="Total Commission" value={inr(team.totalCommission)} />
        <Stat label="Total Recharge" value={inr(team.totalRecharge)} />
      </div>
      <div className="premium-card rounded-2xl p-4 text-center border border-gold/20">
        <p className="text-sm font-semibold text-burgundy">Per Referral: ₹5</p>
        <p className="text-xs text-muted">Credited to Deposit Balance</p>
      </div>

      <div className="premium-card rounded-2xl p-5">
        <h2 className="font-display text-2xl">Invite Section</h2>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted">Your Invite Code</p>
        <div className="mt-1 flex items-center justify-between rounded-xl bg-parchment px-4 py-3">
          <span className="font-display text-3xl tracking-[0.2em]">{team.inviteCode}</span>
          <button type="button" onClick={() => copy(team.inviteCode, 'Invite code')}>
            <Copy size={18} />
          </button>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-muted">Invite Link</p>
        <div className="mt-1 flex items-center gap-2 rounded-xl bg-parchment px-4 py-3">
          <span className="flex-1 truncate text-sm">{team.inviteLink}</span>
          <button type="button" onClick={() => copy(team.inviteLink, 'Invite link')}>
            <Copy size={18} />
          </button>
        </div>
      </div>


    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="premium-card rounded-2xl p-3 text-center">
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
