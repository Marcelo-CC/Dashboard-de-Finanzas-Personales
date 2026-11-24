import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label='Verificando sesión…' />;
  if (!isAuthenticated) return <Navigate to='/login' replace state={{ from: location }} />;
  return <Outlet />;
}

/** Ruta solo para el rol ADMIN (RBAC en la interfaz; el backend vuelve a validar el rol). */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to='/' replace />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner label='Verificando sesión…' />;
  return isAuthenticated ? <Navigate to='/' replace /> : <Outlet />;
}
