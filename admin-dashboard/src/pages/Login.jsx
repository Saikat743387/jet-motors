import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.mobile) return toast.error('Mobile number is required');
    if (!form.password) return toast.error('Password is required');
    setLoading(true);
    try {
      const user = await login(form);
      toast.success('Welcome back');
      const dest = user.role === 'admin' ? '/admin' : location.state?.from || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="premium-card rounded-2xl p-6">
      <h2 className="font-display text-3xl text-ink">Login</h2>
      <p className="mt-1 text-sm text-muted">Sign in with your mobile number</p>
      <label className="mt-6 block text-sm font-medium">
        Mobile Number
        <input
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-gold"
          inputMode="numeric"
          maxLength={10}
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Password
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-gold"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-6 w-full rounded-xl py-3 font-semibold disabled:opacity-60"
      >
        {loading ? 'Please wait…' : 'Login'}
      </button>
      <p className="mt-4 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-burgundy">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
