import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Landmark, Users, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { inr } from '../utils/format';

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data.products.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-card px-5 py-6 text-white border border-line">
        <p className="text-xs uppercase tracking-[0.32em] text-gold">JET MOTORS</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-2xl bg-[#07111F] px-4 py-4 border border-line">
            <p className="text-xs uppercase tracking-wider text-muted">Deposit Balance</p>
            <p className="mt-1 truncate font-display text-2xl text-gold sm:text-3xl">
              {inr((user?.totalDeposit || 0) + (user?.signupBonus || 0))}
            </p>
            <Link
              to="/deposit"
              className="btn-gold mt-3 block rounded-xl py-2.5 text-center text-sm font-semibold"
            >
              Deposit
            </Link>
          </div>
          <div className="min-w-0 rounded-2xl bg-[#07111F] px-4 py-4 border border-line">
            <p className="text-xs uppercase tracking-wider text-muted">Withdrawal Balance</p>
            <p className="mt-1 truncate font-display text-2xl text-gold sm:text-3xl">
              {inr(user?.balance)}
            </p>
            <Link
              to="/withdrawal"
              className="mt-3 block rounded-xl border border-gold/50 py-2.5 text-center text-sm font-semibold text-gold"
            >
              Withdrawal
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-3xl">Featured Products</h2>
          <Link to="/product" className="text-sm font-semibold text-burgundy">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-3xl">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Action to="/deposit" icon={Landmark} label="Deposit" iconClass="text-[#F59E0B]" />
          <Action to="/withdrawal" icon={Wallet} label="Withdrawal" iconClass="text-[#F59E0B]" />
          <Action to="/team" icon={Users} label="Team" iconClass="text-[#F59E0B]" />
          <Action to="/support" icon={Headphones} label="Support" iconClass="text-[#F59E0B]" />
        </div>
      </section>
    </div>
  );
}

function Action({ to, icon: Icon, label, iconClass }) {
  return (
    <Link
      to={to}
      className="premium-card flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-sm font-semibold"
    >
      <span className={`rounded-full bg-parchment p-3 ${iconClass || 'text-burgundy'}`}>
        <Icon size={20} />
      </span>
      {label}
    </Link>
  );
}
