import { Routes, Route } from 'react-router-dom';
import { Layout, ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import AccountsPage from './pages/AccountsPage';
import BudgetPage from './pages/BudgetPage';
import AdminUsersPage from './pages/AdminUsersPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/registro' element={<RegisterPage />} />
        <Route path='/recuperar-contrasena' element={<ForgotPasswordPage />} />
      </Route>
      <Route path='/restablecer-contrasena' element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path='movimientos' element={<TransactionsPage />} />
          <Route path='categorias' element={<CategoriesPage />} />
          <Route path='cuentas' element={<AccountsPage />} />
          <Route path='presupuesto' element={<BudgetPage />} />
          <Route element={<AdminRoute />}>
            <Route path='admin/usuarios' element={<AdminUsersPage />} />
          </Route>
          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
