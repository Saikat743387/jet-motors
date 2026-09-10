import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Info, Landmark, Menu, Wallet, X } from 'lucide-react';
import Logo from './Logo';

const links = [
  { to: '/about', label: 'About Us', icon: Info },
  { to: '/deposit', label: 'Deposit', icon: Landmark },
  { to: '/withdrawal', label: 'Withdrawal', icon: Wallet },
  { to: '/download', label: 'Download', icon: Download },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[#fffcf8]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <div>
            <p className="font-display text-xl leading-none tracking-[0.18em] text-burgundy">
              JET MOTORS
            </p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold-deep">Classic Automotive</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink md:flex">
          {links.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-burgundy">
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg border border-line p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-card px-4 py-3 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(item.to);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-left text-sm"
                >
                  <Icon size={16} className="text-burgundy" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
