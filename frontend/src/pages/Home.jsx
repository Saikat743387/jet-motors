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
      <section className="overflow-hidden rounded-3xl bg-[#2c241c] px-5 py-6 text-[#f7f3ee]">
        <p className="text-xs uppercase tracking-[0.32em] text-gold">JET MOTORS</p>
        <h1 className="mt-2 font-display text-4xl">Welcome Back</h1>
        <p className="mt-1 text-sm text-[#d9ccb8]">
          {user?.userId} · Premium automotive plans
        </p>
        <div className="mt-6 rounded-2xl bg-white/8 px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-[#d9ccb8]">Available Balance</p>
          <p className="mt-1 font-display text-4xl text-gold">{inr(user?.balance)}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/deposit" className="btn-gold rounded-xl py-3 text-center text-sm font-semibold">
            Deposit
          </Link>
          <Link
            to="/withdrawal"
            className="rounded-xl border border-gold/50 py-3 text-center text-sm font-semibold text-gold"
          >
            Withdrawal
          </Link>
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
          <Action to="/deposit" icon={Landmark} label="Deposit" />
          <Action to="/withdrawal" icon={Wallet} label="Withdrawal" />
          <Action to="/team" icon={Users} label="Team" />
          <Action to="/support" icon={Headphones} label="Support" />
        </div>
      </section>
    </div>
  );
}

function Action({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="premium-card flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-sm font-semibold"
    >
      <span className="rounded-full bg-parchment p-3 text-burgundy">
        <Icon size={20} />
      </span>
      {label}
    </Link>
  );
}
