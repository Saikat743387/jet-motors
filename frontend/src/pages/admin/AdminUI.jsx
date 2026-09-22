export function PageTitle({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

const tones = {
  burgundy: 'border-l-burgundy',
  gold: 'border-l-gold-deep',
  green: 'border-l-emerald-600',
  amber: 'border-l-amber-500',
  sky: 'border-l-[#111111]',
  rose: 'border-l-rose-500',
};

export function StatCard({ label, value, tone = 'burgundy', suffix }) {
  return (
    <div className={`premium-card rounded-2xl border-l-4 p-5 ${tones[tone] || tones.burgundy}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl leading-none text-ink md:text-3xl">
        {value}
        {suffix ? <span className="ml-1 text-sm font-sans text-muted">{suffix}</span> : null}
      </p>
    </div>
  );
}

export function Card({ title, subtitle, children, className = '', actions }) {
  return (
    <section className={`premium-card rounded-2xl p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {title ? <h2 className="font-display text-2xl text-ink">{title}</h2> : null}
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function TableShell({ children }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Th({ children, className = '' }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`whitespace-nowrap px-4 py-3 ${className}`}>{children}</td>;
}

export function FilterBar({ children }) {
  return (
    <div className="premium-card flex flex-wrap items-end gap-3 rounded-2xl p-4">
      {children}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  'mt-0.5 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep';

export function TextInput({ value, onChange, placeholder, className = '' }) {
  return <input className={`${inputClass} ${className}`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

export function SelectInput({ value, onChange, options, className = '' }) {
  return (
    <select className={`${inputClass} ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            active === t.value ? 'bg-burgundy text-white' : 'border border-line bg-card text-ink hover:bg-parchment'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyRow({ colSpan, message = 'No records found' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted">
        {message}
      </td>
    </tr>
  );
}

export function Loading({ text = 'Loading…' }) {
  return <p className="py-10 text-center text-sm text-muted">{text}</p>;
}

export function PrimaryBtn({ children, className = '', ...props }) {
  return (
    <button type="button" className={`btn-primary rounded-lg px-4 py-2 text-sm font-semibold ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GhostBtn({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-parchment ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="premium-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <button type="button" className="rounded-lg border border-line px-2 py-1 text-sm text-muted" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}