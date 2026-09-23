import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Users, UserRound } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/product', label: 'Product', icon: LayoutGrid },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/my', label: 'My', icon: UserRound },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 shadow-[0_-8px_24px_rgba(16,24,40,0.08)] backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                  isActive ? 'text-burgundy' : 'text-muted'
                }`
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
