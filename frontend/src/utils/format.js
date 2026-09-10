export function inr(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function statusLabel(status) {
  return String(status || '').replace(/_/g, ' ');
}

export function statusClass(status) {
  const map = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    approved: 'bg-sky-50 text-sky-800 border-sky-200',
    processing: 'bg-amber-50 text-amber-800 border-amber-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    open: 'bg-amber-50 text-amber-800 border-amber-200',
    replied: 'bg-sky-50 text-sky-800 border-sky-200',
    failed: 'bg-rose-50 text-rose-800 border-rose-200',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
    cancelled: 'bg-stone-100 text-stone-600 border-stone-200',
    blocked: 'bg-rose-50 text-rose-800 border-rose-200',
    closed: 'bg-stone-100 text-stone-600 border-stone-200',
  };
  return map[status] || 'bg-stone-100 text-stone-700 border-stone-200';
}

export function assetUrl(path) {
  return '/products/car.jpg';
}
