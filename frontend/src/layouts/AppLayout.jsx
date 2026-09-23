import { Outlet, NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Users, UserRound } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const side = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/product', label: 'Product', icon: LayoutGrid },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/my', label: 'My', icon: UserRound },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="mx-auto flex max-w-5xl">
        <aside className="sticky top-0 hidden h-screen w-52 shrink-0 border-r border-line p-4 md:block">
          <nav className="space-y-1">
            {side.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-burgundy text-white' : 'text-ink hover:bg-parchment'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 pt-5 safe-bottom md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
