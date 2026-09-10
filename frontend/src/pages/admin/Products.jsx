import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { inr } from '../../utils/format';

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
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  async function load() {
    const { data } = await api.get('/admin/products');
    setProducts(data.products);
  }

  useEffect(() => {
    load();
  }, []);

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
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Products</h1>
      <form onSubmit={save} className="premium-card grid gap-3 rounded-2xl p-5 sm:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
        <Field label="Duration (days)" value={form.durationDays} onChange={(v) => setForm({ ...form, durationDays: v })} />
        <Field label="Daily income" value={form.dailyIncome} onChange={(v) => setForm({ ...form, dailyIncome: v })} />
        <Field label="Total income" value={form.totalIncome} onChange={(v) => setForm({ ...form, totalIncome: v })} />
        <label className="block text-sm">
          Image
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          {form.image ? <p className="mt-1 truncate text-xs text-muted">{form.image}</p> : null}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary rounded-xl px-5 py-2.5 font-semibold">
            {editing ? 'Update product' : 'Create product'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p._id} className="premium-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">
                {inr(p.price)} · {p.durationDays}d · Daily {inr(p.dailyIncome)} · {p.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-line px-3 py-1.5 text-sm"
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
              <button type="button" className="rounded-lg border border-line px-3 py-1.5 text-sm" onClick={() => deactivate(p._id)}>
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
