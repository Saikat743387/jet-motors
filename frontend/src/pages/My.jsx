import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Download,
  Headphones,
  Landmark,
  LogOut,
  Package,
  Receipt,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { inr } from '../utils/format';

const account = [
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/recharge-history', label: 'Recharge History', icon: Landmark },
  { to: '/withdrawal-history', label: 'Withdrawal History', icon: Wallet },
  { to: '/my-products', label: 'My Products', icon: Package },
  { to: '/download', label: 'Download', icon: Download },
  { to: '/support', label: 'Customer Support', icon: Headphones },
];

export default function My() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">My</h1>
      <div className="premium-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted">User Information</p>
        <Row label="User ID" value={user?.userId} />
        <Row label="Mobile Number" value={user?.mobile} />
        <Row label="Balance" value={inr(user?.balance)} />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link to="/deposit" className="btn-primary rounded-xl py-2 text-center text-xs font-semibold">
            Deposit
          </Link>
          <Link to="/withdrawal" className="btn-gold rounded-xl py-2 text-center text-xs font-semibold">
            Withdrawal
          </Link>
          <Link to="/support" className="rounded-xl border border-line py-2 text-center text-xs font-semibold">
            Support
          </Link>
        </div>
      </div>

      <div className="premium-card overflow-hidden rounded-2xl">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-display text-2xl">ACCOUNT</h2>
        </div>
        {account.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between border-b border-line px-5 py-3.5 last:border-b-0"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Icon size={18} className="text-burgundy" />
                {item.label}
              </span>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          );
        })}
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-medium text-burgundy"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          <span className="flex items-center gap-3">
            <LogOut size={18} />
            Logout
          </span>
        </button>
      </div>
    </div>
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
