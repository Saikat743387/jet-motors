import { useNavigate } from 'react-router-dom';
import { inr } from '../utils/format';

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <article className="premium-card overflow-hidden rounded-2xl">
      <div className="relative h-32 bg-parchment overflow-hidden">
        <img
          src="/products/car.jpg"
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          <svg
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          Verified
        </span>
      </div>
      <div className="px-4 py-4">
        <h3 className="font-display text-xl text-ink">{product.name}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Meta label="Duration" value={`${product.durationDays} Days`} />
          <Meta label="Daily Income" value={inr(product.dailyIncome)} />
          <Meta label="Total Income" value={inr(product.totalIncome)} />
          <Meta label="Price" value={inr(product.price)} />
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-xl py-2 text-sm font-semibold tracking-wide bg-[#22C55E] text-white hover:bg-[#4ADE80] active:bg-[#16A34A] shadow-[0_4px_14px_rgba(34,197,94,0.35)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.45)] transition-all"
          onClick={() => navigate(`/deposit?productId=${product._id}`)}
        >
          BUY
        </button>
      </div>
    </article>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className="font-semibold text-ink">{value}</p>
    </div>
  );
}