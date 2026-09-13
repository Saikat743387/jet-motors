import { statusClass, statusLabel } from '../utils/format';

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
