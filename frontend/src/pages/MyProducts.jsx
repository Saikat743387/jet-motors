import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { assetUrl, formatDate, inr } from '../utils/format';

export default function MyProducts() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/me/products').then(({ data }) => setRows(data.purchases));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">My Products</h1>
      <div className="mt-5 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="No products purchased" hint="Buy a plan from the Product page." />
        ) : (
          rows.map((row) => (
            <article key={row._id} className="premium-card overflow-hidden rounded-2xl">
              <div className="flex gap-4 p-4">
                <img src={assetUrl(row.productImage)} alt="" className="h-20 w-24 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h2 className="font-display text-2xl">{row.productName}</h2>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="text-sm text-muted">Purchase Price {inr(row.price)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-line px-4 py-4 text-sm">
                <Meta
                  label="Duration"
                  value={`${row.durationDays} Days`}
                  icon={<Clock size={14} className="text-[#2563EB]" aria-hidden="true" />}
                />
                <Meta label="Daily Income" value={inr(row.dailyIncome)} />
                <Meta label="Total Income" value={inr(row.totalIncome)} />
                <Meta label="Start date" value={formatDate(row.startDate)} />
                <Meta label="End date" value={formatDate(row.endDate)} />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function Meta({ label, value, icon = null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`font-semibold ${icon ? 'flex items-center gap-1' : ''}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}
