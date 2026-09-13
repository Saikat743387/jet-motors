import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminTickets() {
  const [rows, setRows] = useState([]);
  const [reply, setReply] = useState({});

  async function load() {
    const { data } = await api.get('/admin/tickets');
    setRows(data.tickets);
  }
  useEffect(() => {
    load();
  }, []);

  async function send(id, close = false) {
    try {
      await api.post(`/admin/tickets/${id}/reply`, { message: reply[id], close });
      setReply((r) => ({ ...r, [id]: '' }));
      toast.success('Reply sent');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reply failed');
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Support Tickets</h1>
      <div className="mt-5 space-y-4">
        {rows.map((t) => (
          <div key={t._id} className="premium-card rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted">
                  {t.ticketId} · {t.userId?.userId}
                </p>
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
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-line px-3 py-2 text-sm"
                placeholder="Reply"
                value={reply[t._id] || ''}
                onChange={(e) => setReply({ ...reply, [t._id]: e.target.value })}
              />
              <button type="button" className="btn-primary rounded-xl px-3 text-sm" onClick={() => send(t._id)}>
                Reply
              </button>
              <button type="button" className="rounded-xl border border-line px-3 text-sm" onClick={() => send(t._id, true)}>
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
