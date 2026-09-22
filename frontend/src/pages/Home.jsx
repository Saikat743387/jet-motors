import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      <section className="overflow-hidden rounded-3xl bg-[#1E1B4B] px-5 py-6 text-white border border-[#1E1B4B]">
        <p className="text-xs uppercase tracking-[0.32em] text-emerald-400">JET MOTORS</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-2xl bg-white/10 px-4 py-4 border border-white/15">
            <p className="text-xs uppercase tracking-wider text-white/70">Deposit Balance</p>
            <p className="mt-1 truncate font-display text-2xl text-white sm:text-3xl">
              {inr((user?.depositBalance ?? user?.totalDeposit ?? 0) + (user?.signupBonus || 0))}
            </p>
            <Link
              to="/deposit"
              className="mt-3 block rounded-xl bg-[#16A34A] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#15803D]"
            >
              Deposit
            </Link>
          </div>
          <div className="min-w-0 rounded-2xl bg-white/10 px-4 py-4 border border-white/15">
            <p className="text-xs uppercase tracking-wider text-white/70">Withdrawal Balance</p>
            <p className="mt-1 truncate font-display text-2xl text-white sm:text-3xl">
              {inr(user?.balance)}
            </p>
            <Link
              to="/withdrawal"
              className="mt-3 block rounded-xl border border-white/30 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10"
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
    </div>
  );
}
