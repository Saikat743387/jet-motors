import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { formatDate, inr } from '../utils/format';

export default function TeamMembers() {
  const { level } = useParams();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get(`/team/${level}`).then(({ data }) => setMembers(data.members));
  }, [level]);

  return (
    <div>
      <h1 className="font-display text-4xl">Level {level} Members</h1>
      <div className="mt-5 space-y-3">
        {members.length === 0 ? (
          <EmptyState title="No members yet" hint="Share your invite code to grow this level." />
        ) : (
          members.map((m) => (
            <div key={m.userId} className="premium-card flex items-center justify-between rounded-2xl p-4">
              <div>
                <p className="font-semibold">{m.userId}</p>
                <p className="text-sm text-muted">{m.mobile}</p>
              </div>
              <div className="text-right text-sm">
                <p>{inr(m.totalDeposit)}</p>
                <p className="text-muted">{formatDate(m.joinedAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
