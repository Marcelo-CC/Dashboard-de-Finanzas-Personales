import { toast } from 'react-toastify';
import { adminApi } from '../api/services';
import { PageHeader, Spinner, ErrorState } from '../components/ui';
import { confirmDialog } from '../utils/alerts';
import { formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useAsyncData } from '../hooks/useAsyncData';

/** Gestión de usuarios y roles (RBAC). No muestra información financiera de los usuarios. */
export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const { data: users, error, reload: load } = useAsyncData(() => adminApi.users(), []);

  const changeRole = async (u, role) => {
    try {
      await adminApi.changeRole(u.id, role);
      toast.success('Rol actualizado correctamente');
    } catch (err) {
      toast.error(err.message);
    }
    load();
  };

  const toggleActive = async (u) => {
    const next = !u.active;
    if (!next && !(await confirmDialog({ title: `¿Desactivar a ${u.name}?`, text: 'No podrá iniciar sesión. Sus datos financieros se conservan.', confirmText: 'Desactivar', danger: true }))) return;
    try {
      await adminApi.setActive(u.id, next);
      toast.success(next ? 'Cuenta activada' : 'Cuenta desactivada');
    } catch (err) {
      toast.error(err.message);
    }
    load();
  };

  return (
    <>
      <PageHeader title='Usuarios y roles' subtitle='Control de acceso basado en roles (RBAC). Por confidencialidad, aquí no se muestran datos financieros.' />
      {error && <ErrorState message={error} onRetry={load} />}
      {!users && !error && <Spinner />}
      {users && (
        <div className='card overflow-x-auto p-0'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-50'>
              <tr><th className='table-th'>Nombre</th><th className='table-th'>Correo</th><th className='table-th'>Rol</th><th className='table-th'>Estado</th><th className='table-th'>Registro</th><th className='table-th'>Último cambio de rol</th><th className='table-th' /></tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className='table-td font-medium'>{u.name}{u.id === me.id && <span className='ml-1 text-xs text-slate-400'>(tú)</span>}</td>
                  <td className='table-td text-slate-600'>{u.email}</td>
                  <td className='table-td'>
                    <select className='input w-auto py-1' value={u.role} onChange={(e) => changeRole(u, e.target.value)} aria-label={`Rol de ${u.name}`}>
                      <option value='USER'>USUARIO</option><option value='ADMIN'>ADMINISTRADOR</option>
                    </select>
                  </td>
                  <td className='table-td'>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{u.active ? 'Activa' : 'Desactivada'}</span>
                  </td>
                  <td className='table-td text-slate-500'>{formatDate(u.createdAt)}</td>
                  <td className='table-td text-slate-500'>{u.roleChangedAt ? formatDate(u.roleChangedAt) : '—'}</td>
                  <td className='table-td text-right'>
                    {u.id !== me.id && (
                      <button type='button' className={u.active ? 'btn-secondary' : 'btn-primary'} onClick={() => toggleActive(u)}>{u.active ? 'Desactivar' : 'Activar'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
