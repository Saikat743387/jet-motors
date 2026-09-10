import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BadgeIndianRupee,
  Boxes,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  Landmark,
  Network,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/products', label: 'Products', icon: Boxes },
  { to: '/admin/purchases', label: 'Purchases', icon: ShoppingBag },
  { to: '/admin/deposits', label: 'Deposits', icon: Landmark },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { to: '/admin/teams', label: 'Teams / Referrals', icon: Network },
  { to: '/admin/commissions', label: 'Commissions', icon: BadgeIndianRupee },
  { to: '/admin/tickets', label: 'Support Tickets', icon: LifeBuoy },
  { to: '/admin/settings', label: 'App Settings', icon: Settings },
  { to: '/admin/logs', label: 'Activity Logs', icon: Activity },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ivory md:flex">
      <aside className="border-b border-line bg-[#2c241c] text-[#f7f3ee] md:flex md:min-h-screen md:w-64 md:flex-col md:border-b-0 md:border-r md:border-black/20">
        <div className="flex items-center gap-3 px-5 py-4">
          <Logo className="h-9 w-9" />
          <div>
            <p className="font-display text-xl tracking-widest">JET MOTORS</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Admin Panel</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isActive ? 'bg-burgundy text-white' : 'text-[#efe6d8] hover:bg-white/10'
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <button
          type="button"
          className="m-3 hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#efe6d8] hover:bg-white/10 md:flex"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
