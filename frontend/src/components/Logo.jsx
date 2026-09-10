export default function Logo({ className = 'h-9 w-9' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="12" fill="#8B1E1E" />
      <path d="M8 34 L32 12 L56 34 L48 34 L48 50 L16 50 L16 34 Z" fill="#C4A35A" />
      <rect x="28" y="38" width="8" height="12" fill="#8B1E1E" />
    </svg>
  );
}
