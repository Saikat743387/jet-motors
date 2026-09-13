import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { inr } from '../../utils/format';
import { EmptyRow, Field, Loading, PageTitle, TableShell, Td, Th } from './AdminUI';

const empty = {
  name: '',
  image: '',
  durationDays: 100,
  dailyIncome: '',
  totalIncome: '',
  price: '',
  isActive: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  async function load() {
    setProducts(null);
    const { data } = await api.get('/admin/products');
    setProducts(data.products);
  }

  useEffect(() => { load(); }, []);

  async function upload(file) {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/admin/upload', fd);
    setForm((f) => ({ ...f, image: data.url }));
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.patch(`/admin/products/${editing}`, form);
      else await api.post('/admin/products', form);
      setForm(empty);
      setEditing(null);
      toast.success('Product saved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  }

  async function deactivate(id) {
    await api.delete(`/admin/products/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Products" subtitle="Manage products, pricing and purchase stats" />

      <form onSubmit={save} className="premium-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
        <Field label="Name">
          <input className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Price (₹)">
          <input className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </Field>
        <Field label="Duration (days)">
          <input className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
        </Field>
        <Field label="Daily income (₹)">
          <input className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm" value={form.dailyIncome} onChange={(e) => setForm({ ...form, dailyIncome: e.target.value })} />
        </Field>
        <Field label="Total income (₹)">
          <input className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm" value={form.totalIncome} onChange={(e) => setForm({ ...form, totalIncome: e.target.value })} />
        </Field>
        <Field label="Image">
          <input type="file" accept="image/*" className="mt-1 w-full text-sm" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {form.image ? <p className="mt-1 truncate text-xs text-muted">{form.image}</p> : null}
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>
        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary rounded-lg px-5 py-2 text-sm font-semibold">
            {editing ? 'Update product' : 'Create product'}
          </button>
          {editing ? (
            <button
              type="button"
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold"
              onClick={() => { setEditing(null); setForm(empty); }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="premium-card rounded-2xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-parchment">
            <tr>
              <Th>Product</Th>
              <Th>Price</Th>
              <Th>Duration</Th>
              <Th>Daily income</Th>
              <Th>Total income</Th>
              <Th>Purchases</Th>
              <Th>Revenue</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!products ? (
              <tr><td colSpan={9}><Loading /></td></tr>
            ) : products.length === 0 ? (
              <EmptyRow colSpan={9} message="No products yet" />
            ) : (
              products.map((p) => (
                <tr key={p._id} className="hover:bg-parchment/50">
                  <Td className="font-semibold">{p.name}</Td>
                  <Td>{inr(p.price)}</Td>
                  <Td>{p.durationDays}d</Td>
                  <Td>{inr(p.dailyIncome)}</Td>
                  <Td>{inr(p.totalIncome)}</Td>
                  <Td className="font-semibold">{p.purchaseCount ?? 0}</Td>
                  <Td>{inr(p.purchaseRevenue ?? 0)}</Td>
                  <Td>
                    <span className={`text-xs font-semibold ${p.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
                        onClick={() => {
                          setEditing(p._id);
                          setForm({
                            name: p.name,
                            image: p.image,
                            durationDays: p.durationDays,
                            dailyIncome: p.dailyIncome,
                            totalIncome: p.totalIncome,
                            price: p.price,
                            isActive: p.isActive,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        onClick={() => deactivate(p._id)}
                      >
                        Deactivate
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}