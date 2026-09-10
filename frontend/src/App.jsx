import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Product from './pages/Product';
import Deposit from './pages/Deposit';
import Payment from './pages/Payment';
import Withdrawal from './pages/Withdrawal';
import Team from './pages/Team';
import TeamMembers from './pages/TeamMembers';
import My from './pages/My';
import Transactions from './pages/Transactions';
import RechargeHistory from './pages/RechargeHistory';
import WithdrawalHistory from './pages/WithdrawalHistory';
import MyProducts from './pages/MyProducts';
import Support from './pages/Support';
import Download from './pages/Download';
import About from './pages/About';
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
        Loading JET MOTORS…
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<Product />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/deposit/:id/pay" element={<Payment />} />
        <Route path="/withdrawal" element={<Withdrawal />} />
        <Route path="/team" element={<Team />} />
        <Route path="/team/:level" element={<TeamMembers />} />
        <Route path="/my" element={<My />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/recharge-history" element={<RechargeHistory />} />
        <Route path="/withdrawal-history" element={<WithdrawalHistory />} />
        <Route path="/my-products" element={<MyProducts />} />
        <Route path="/support" element={<Support />} />
        <Route path="/download" element={<Download />} />
        <Route path="/about" element={<About />} />
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

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
