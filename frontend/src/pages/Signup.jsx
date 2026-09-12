import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { register, settings } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteFromLink = useMemo(() => params.get('ref') || params.get('invite') || '', [params]);
  const [form, setForm] = useState({
    mobile: '',
    password: '',
    confirmPassword: '',
    inviteCode: inviteFromLink,
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.mobile) return toast.error('Mobile number is required');
    if (!form.password) return toast.error('Password is required');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (settings?.inviteRequired && !form.inviteCode) return toast.error('Invite code is required');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="premium-card rounded-2xl p-6">
      <h2 className="font-display text-3xl text-ink">Sign Up</h2>
      <p className="mt-1 text-sm text-muted">Create your JET MOTORS account</p>
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
      <label className="mt-4 block text-sm font-medium">
        Confirm Password
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-gold"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Invite Code {settings?.inviteRequired ? '' : '(optional)'}
        <input
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 uppercase outline-none focus:border-gold"
          value={form.inviteCode}
          onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-6 w-full rounded-xl py-3 font-semibold disabled:opacity-60"
      >
        {loading ? 'Creating account…' : 'Sign Up'}
      </button>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-burgundy">
          Login
        </Link>
      </p>
    </form>
  );
}
