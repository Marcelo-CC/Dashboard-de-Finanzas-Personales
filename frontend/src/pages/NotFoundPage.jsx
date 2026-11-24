import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center'>
      <p className='text-5xl font-bold text-slate-300'>404</p>
      <p className='text-slate-600'>La página que buscas no existe.</p>
      <Link to='/' className='btn-primary'>Ir al dashboard</Link>
    </div>
  );
}
