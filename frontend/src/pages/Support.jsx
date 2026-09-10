import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function Support() {
  const { settings } = useAuth();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [tickets, setTickets] = useState([]);

  async function load() {
    const { data } = await api.get('/me/tickets');
    setTickets(data.tickets);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/me/tickets', form);
      setForm({ subject: '', message: '' });
      toast.success('Ticket submitted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit ticket');
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Customer Support</h1>
      <div className="premium-card rounded-2xl p-5">
        <p className="font-semibold">Contact Support</p>
        <p className="mt-1 text-sm text-muted">{settings?.supportEmail || 'support@jetmotors.local'}</p>
        {settings?.supportPhone ? <p className="text-sm text-muted">{settings.supportPhone}</p> : null}
      </div>
      <form onSubmit={submit} className="premium-card rounded-2xl p-5">
        <h2 className="font-display text-2xl">Submit a Ticket</h2>
        <input
          className="mt-4 w-full rounded-xl border border-line px-3 py-2.5"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <textarea
          className="mt-3 min-h-28 w-full rounded-xl border border-line px-3 py-2.5"
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <button type="submit" className="btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">
          Submit
        </button>
      </form>
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t._id} className="premium-card rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted">{t.ticketId}</p>
                <p className="font-semibold">{t.subject}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {t.messages.map((m, i) => (
                <p key={i} className="rounded-lg bg-parchment px-3 py-2">
                  <span className="font-semibold capitalize">{m.senderRole}: </span>
                  {m.message}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
