export default function EmptyState({ title, hint }) {
  return (
    <div className="premium-card rounded-2xl px-6 py-10 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
