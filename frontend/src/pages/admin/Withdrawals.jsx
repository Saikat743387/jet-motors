import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, inr } from '../../utils/format';

const actions = ['approved', 'rejected', 'processing', 'completed'];

export default function AdminWithdrawals() {
  const [rows, setRows] = useState([]);
  async function load() {
    const { data } = await api.get('/admin/withdrawals');
    setRows(data.withdrawals);
  }
  useEffect(() => {
    load();
  }, []);

  async function update(id, status) {
    try {
      await api.patch(`/admin/withdrawals/${id}`, { status });
      toast.success(`Marked ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Withdrawals</h1>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row._id} className="premium-card rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {row.userId?.userId} · {inr(row.amount)}
                </p>
                <p className="text-xs text-muted">{row.withdrawalId}</p>
                <p className="mt-1 text-sm">
                  {row.bankSnapshot?.holderName} · {row.bankSnapshot?.accountNumberMasked} · {row.bankSnapshot?.ifscCode}
                </p>
                <p className="text-xs text-muted">{formatDate(row.createdAt)}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            {row.status !== 'completed' && row.status !== 'rejected' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold capitalize"
                    onClick={() => update(row._id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
