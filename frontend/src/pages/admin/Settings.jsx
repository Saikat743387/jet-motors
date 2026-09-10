import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminSettings() {
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => setForm(data.settings));
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      const { data } = await api.patch('/admin/settings', form);
      setForm(data.settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  }

  if (!form) return <p className="text-muted">Loading…</p>;

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4">
      <h1 className="font-display text-4xl">App Settings</h1>
      <label className="block text-sm">
        App name
        <input
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
          value={form.appName || ''}
          onChange={(e) => setForm({ ...form, appName: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Minimum withdrawal
        <input
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
          value={form.minWithdrawal || ''}
          onChange={(e) => setForm({ ...form, minWithdrawal: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Support email
        <input
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
          value={form.supportEmail || ''}
          onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Support phone
        <input
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
          value={form.supportPhone || ''}
          onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        About text
        <textarea
          className="mt-1 min-h-32 w-full rounded-xl border border-line px-3 py-2.5"
          value={form.aboutText || ''}
          onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!form.inviteRequired}
          onChange={(e) => setForm({ ...form, inviteRequired: e.target.checked })}
        />
        Invite code required at signup
      </label>
      <button type="submit" className="btn-primary rounded-xl px-5 py-2.5 font-semibold">
        Save settings
      </button>
    </form>
  );
}
