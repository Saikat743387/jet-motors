import { useEffect, useState } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

export default function Product() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/products')
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Products</h1>
      <p className="mt-1 text-sm text-muted">Choose a plan. Prices are loaded from the server.</p>
      {loading ? (
        <p className="mt-8 text-muted">Loading plans…</p>
      ) : products.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No plans available" hint="Please check back shortly." />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
