import { useNavigate } from 'react-router-dom';
import { inr, assetUrl } from '../utils/format';

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <article className="premium-card overflow-hidden rounded-2xl">
      <div className="relative h-36 bg-parchment">
        <img
          src={assetUrl(product.image)}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2c241c]/70 to-transparent px-4 py-3">
          <h3 className="font-display text-2xl text-white">{product.name}</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-4 text-sm">
        <Meta label="Duration" value={`${product.durationDays} Days`} />
        <Meta label="Daily Income" value={inr(product.dailyIncome)} />
        <Meta label="Total Income" value={inr(product.totalIncome)} />
        <Meta label="Price" value={inr(product.price)} />
      </div>
      <div className="px-4 pb-4">
        <button
          type="button"
          className="btn-primary w-full rounded-xl py-2.5 text-sm font-semibold tracking-wide"
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
