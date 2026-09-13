import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminProducts from './pages/admin/Products';
import AdminPurchases from './pages/admin/Purchases';
import AdminDeposits from './pages/admin/Deposits';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminTransactions from './pages/admin/Transactions';
import AdminTeams from './pages/admin/Teams';
import AdminCommissions from './pages/admin/Commissions';
import AdminTickets from './pages/admin/Tickets';
import AdminSettings from './pages/admin/Settings';
import AdminLogs from './pages/admin/Logs';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory text-muted">
        Loading JET MOTORS Admin…
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Login />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="purchases" element={<AdminPurchases />} />
        <Route path="deposits" element={<AdminDeposits />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="commissions" element={<AdminCommissions />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/login'} replace />} />
    </Routes>
  );
}
