import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const FIXED_ADMIN_ID = 'Saikat7433';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ userId: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const uid = form.userId.trim();
    if (!uid) return toast.error('User ID is required');
    if (uid !== FIXED_ADMIN_ID) return toast.error('Invalid User ID');
    if (!form.password) return toast.error('Password is required');
    setLoading(true);
    try {
      const user = await login({ userId: uid, password: form.password });
      if (user.role !== 'admin') {
        toast.error('Access denied: Admin only');
        return;
      }
      toast.success('Welcome back');
      const dest = location.state?.from || '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="premium-card rounded-2xl p-6">
      <h2 className="font-display text-3xl text-ink">Admin Login</h2>
      <p className="mt-1 text-sm text-muted">JET MOTORS Admin Dashboard — Authorized access only</p>
      <label className="mt-6 block text-sm font-medium">
        User ID
        <input
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-gold"
          placeholder={FIXED_ADMIN_ID}
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          autoComplete="username"
        />
      </label>
      <p className="mt-1 text-xs text-muted">Fixed Admin User ID: {FIXED_ADMIN_ID}</p>
      <label className="mt-4 block text-sm font-medium">
        Password
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-gold"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="current-password"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-6 w-full rounded-xl py-3 font-semibold disabled:opacity-60"
      >
        {loading ? 'Please wait…' : 'Login'}
      </button>
      <p className="mt-4 text-center text-xs text-muted">User login is on the main JET MOTORS app. This dashboard is admin-only.</p>
    </form>
  );
}
