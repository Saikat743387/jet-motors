import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PurchasedPlanCard from '../components/PurchasedPlanCard';
import EmptyState from '../components/EmptyState';

export default function Product() {
  const { refresh } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/me/products');
      setRows(data.purchases || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaimed() {
    await load();
    refresh().catch(() => {});
  }

  return (
    <div>
      <h1 className="font-display text-4xl">My Plans</h1>
      <p className="mt-1 text-sm text-muted">Only the plans you have purchased appear here.</p>
      {loading ? (
        <p className="mt-8 text-muted">Loading plans…</p>
      ) : rows.length === 0 ? (
        <div className="mt-6 space-y-4">
          <EmptyState title="No active plans" hint="You have not purchased any plan yet." />
          <Link to="/" className="btn-primary block rounded-xl py-3 text-center font-semibold">
            Browse Plans
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <PurchasedPlanCard key={row._id} row={row} onClaimed={handleClaimed} />
          ))}
        </div>
      )}
    </div>
  );
}
