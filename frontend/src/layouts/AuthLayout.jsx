import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-14 w-14" />
          <h1 className="mt-4 font-display text-4xl tracking-[0.2em] text-burgundy">JET MOTORS</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.32em] text-gold-deep">Classic Automotive</p>
          <div className="gold-rule mt-5 w-40" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
