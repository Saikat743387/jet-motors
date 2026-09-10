import { useAuth } from '../context/AuthContext';

export default function About() {
  const { settings } = useAuth();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl">About Us</h1>
      <div className="premium-card mt-5 rounded-2xl p-6 leading-7 text-ink">
        <p>{settings?.aboutText}</p>
        <p className="mt-4 text-sm text-muted">
          Plan figures are product features, not guaranteed financial or investment returns. Confirm
          applicable laws, payment-provider rules, tax, and consumer-protection requirements before
          operating with real money.
        </p>
      </div>
    </div>
  );
}
