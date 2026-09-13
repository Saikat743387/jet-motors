import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { inr } from '../utils/format';

export default function Deposit() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const productId = params.get('productId');
  const [options, setOptions] = useState({ amounts: [], products: [] });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [amount, setAmount] = useState('');
  const [other, setOther] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/deposits/options').then(({ data }) => {
      setOptions(data);
      if (productId) {
        const match = data.products.find((p) => p._id === productId);
        if (match) {
          setSelectedProduct(match);
          setAmount(String(match.price));
        }
      }
    });
  }, [productId]);

  const chips = useMemo(() => options.amounts, [options.amounts]);

  async function proceed() {
    const value = Number(amount);
    if (!value || value <= 0) return toast.error('Select a deposit amount');
    setLoading(true);
    try {
      const { data } = await api.post('/deposits', {
        productId: selectedProduct?._id,
        amount: selectedProduct ? undefined : value,
      });
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

      {selectedProduct ? (
        <div className="premium-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Selected Product</p>
          <p className="mt-1 font-display text-3xl">{selectedProduct.name}</p>
          <p className="mt-2 text-sm text-muted">Price is taken from the product record, not typed by you.</p>
        </div>
      ) : null}

      <div className="premium-card rounded-2xl p-5">
        <p className="text-sm font-semibold">Select Amount</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                !other && Number(amount) === chip
                  ? 'border-burgundy bg-burgundy text-white'
                  : 'border-line bg-ivory text-ink'
              }`}
              onClick={() => {
                const product = options.products.find((p) => p.price === chip);
                setSelectedProduct(product || selectedProduct);
                setAmount(String(chip));
                setOther(false);
              }}
            >
              {inr(chip)}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={proceed}
          className="btn-primary mt-5 w-full rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {loading ? 'Preparing…' : 'PROCEED TO PAYMENT'}
        </button>
      </div>
    </div>
  );
}
