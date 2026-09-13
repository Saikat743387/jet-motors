import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/format';

export default function AdminLogs() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/admin/logs').then(({ data }) => setRows(data.logs));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Activity Logs</h1>
      <div className="mt-5 space-y-2">
        {rows.map((row) => (
          <div key={row._id} className="premium-card rounded-xl px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <p className="font-semibold">{row.action}</p>
              <p className="text-muted">{formatDate(row.createdAt)}</p>
            </div>
            <p className="text-muted">
              {row.actorRole} {row.actorId?.userId || ''} · {row.targetType} {row.targetId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
