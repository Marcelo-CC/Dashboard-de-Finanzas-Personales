import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiPieChart, FiList, FiTag, FiCreditCard, FiTarget, FiUsers, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: FiPieChart, end: true },
  { to: '/movimientos', label: 'Movimientos', icon: FiList },
  { to: '/categorias', label: 'Categorías', icon: FiTag },
  { to: '/cuentas', label: 'Cuentas', icon: FiCreditCard },
  { to: '/presupuesto', label: 'Presupuesto', icon: FiTarget },
];

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = isAdmin ? [...NAV, { to: '/admin/usuarios', label: 'Usuarios y roles', icon: FiUsers }] : NAV;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className='min-h-screen lg:flex'>
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 p-4 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='mb-8 flex items-center gap-2 px-2 pt-2'>
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white'>S/</span>
          <div>
            <p className='text-sm font-semibold text-white'>Finanzas Personales</p>
            <p className='text-xs text-slate-400'>Dashboard</p>
          </div>
        </div>
        <nav className='space-y-1'>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
              <Icon aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className='fixed inset-0 z-20 bg-slate-900/40 lg:hidden' onClick={() => setOpen(false)} />}

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-8'>
          <button type='button' className='btn-ghost px-2 lg:hidden' onClick={() => setOpen(true)} aria-label='Abrir menú'>
            <FiMenu />
          </button>
          <p className='text-sm text-slate-600'>
            Bienvenido(a), <span className='font-semibold text-slate-900'>{user?.name?.split(' ')[0]}</span>
            {isAdmin && <span className='ml-2 rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700'>ADMIN</span>}
          </p>
          <button type='button' className='btn-ghost' onClick={() => logout()}>
            <FiLogOut aria-hidden /> Cerrar sesión
          </button>
        </header>
        <main className='flex-1 p-4 lg:p-8'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
