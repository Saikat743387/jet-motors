import { Link } from 'react-router-dom';

const links = [
  { to: '/about', label: 'About Us' },
  { to: '/deposit', label: 'Deposit' },
  { to: '/withdrawal', label: 'Withdrawal' },
  { to: '/download', label: 'Download' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="JET MOTORS" className="h-9 w-9 rounded-lg object-cover" />
          <div>
            <p className="font-display text-xl leading-none tracking-[0.18em] text-[#45A3FF]">
              JET MOTORS
            </p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#1683FF]">Classic Automotive</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink md:flex">
          {links.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-burgundy">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}