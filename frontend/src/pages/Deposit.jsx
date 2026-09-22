import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import api from '../services/api';
import { inr } from '../utils/format';

const PRESETS = [100, 300, 500, 1000, 1500];

export default function Deposit() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const productId = params.get('productId');
  const [options, setOptions] = useState({ amounts: [], products: [] });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/deposits/options').then(({ data }) => {
      setOptions(data);
      if (productId) {
        const match = data.products.find((p) => p._id === productId);
        if (match) setSelectedProduct(match);
      }
    });
  }, [productId]);

  async function proceed() {
    const raw = String(amount ?? '').trim();
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value <= 0) {
      return toast.error('Enter a valid deposit amount');
    }
    if (value < 100) {
      return toast.error('Minimum deposit is ₹100');
    }
    const rounded = Math.round(value * 100) / 100;
    setLoading(true);
    try {
      const { data } = await api.post('/deposits', { amount: rounded });
      navigate(`/deposit/${data.depositId}/pay`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start deposit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="font-display text-4xl">Deposit</h1>
      <p className="text-sm text-muted">
        Deposits only add to your <span className="font-semibold text-ink">Deposit Balance</span>. Plans are
        never purchased by depositing — tap <span className="font-semibold text-ink">Buy Now</span> on the plan
        afterward.
      </p>
      <p className="text-sm font-semibold text-burgundy">Minimum deposit is ₹100</p>

      {selectedProduct ? (
        <div className="premium-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Selected Product</p>
          <p className="mt-1 font-display text-3xl">{selectedProduct.name}</p>
          <p className="mt-2 text-sm text-muted">
            Plan price {inr(selectedProduct.price)} — reference only. You can deposit any amount.
          </p>
          <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs text-gold-deep">
            This deposit will NOT buy the plan. It only adds to your Deposit Balance — Buy Now after depositing.
          </p>
        </div>
      ) : null}

      <div className="premium-card rounded-2xl p-5">
        <p className="text-sm font-semibold">Select Amount</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const active = amount.trim() !== '' && Number(amount) === preset;
            return (
              <button
                key={preset}
                type="button"
                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                  active ? 'border-burgundy bg-burgundy text-white' : 'border-line bg-ivory text-ink'
                }`}
                onClick={() => setAmount(String(preset))}
              >
                {inr(preset)}
              </button>
            );
          })}
        </div>

        <label htmlFor="enter-amount" className="mt-5 block text-sm font-medium">
          Enter Amount
          <input
            id="enter-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="mt-1 w-full rounded-xl border border-line bg-ivory px-3 py-2.5 text-ink placeholder:text-muted outline-none focus:border-gold"
            placeholder="Enter Amount (Min ₹100)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <p className="mt-1 text-xs text-muted">Minimum deposit is ₹100</p>

        <button
          type="button"
          disabled={loading}
          onClick={proceed}
          className="btn-primary mt-5 w-full rounded-xl py-3 font-semibold disabled:opacity-60 flex items-center justify-center gap-2 group"
        >
          {loading ? 'Preparing…' : (
            <>
              PROCEED TO PAYMENT
              <ArrowRight size={18} className="text-white/90 transition-colors group-hover:text-white group-active:text-white" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
