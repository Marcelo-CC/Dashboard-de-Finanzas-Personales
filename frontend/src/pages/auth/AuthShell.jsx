export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-brand-700 p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-6 text-center text-white'>
          <span className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lg font-bold'>S/</span>
          <h1 className='text-2xl font-bold'>Dashboard de Finanzas Personales</h1>
        </div>
        <div className='card p-6'>
          <h2 className='text-xl font-semibold text-slate-900'>{title}</h2>
          {subtitle && <p className='mt-1 text-sm text-slate-500'>{subtitle}</p>}
          <div className='mt-5'>{children}</div>
        </div>
        {footer && <div className='mt-4 text-center text-sm text-white/80'>{footer}</div>}
      </div>
    </div>
  );
}

