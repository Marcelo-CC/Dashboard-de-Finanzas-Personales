/** Componentes de interfaz reutilizables y sin lógica de negocio. */
export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className='flex items-center justify-center gap-3 py-10 text-sm text-slate-500' role='status'>
      <span className='h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600' />
      {label}
    </div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className='block'>
      <span className='label'>{label}</span>
      {children}
      {hint && !error && <p className='mt-1 text-xs text-slate-500'>{hint}</p>}
      {error && <p className='field-error'>{error}</p>}
    </label>
  );
}

export function EmptyState({ icon, title, action }) {
  return (
    <div className='flex flex-col items-center gap-3 py-12 text-center'>
      {icon && <div className='text-4xl text-slate-300'>{icon}</div>}
      <p className='text-sm text-slate-500'>{title}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className='flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 py-8 text-center'>
      <p className='text-sm text-red-700'>{message}</p>
      {onRetry && (
        <button type='button' className='btn-secondary' onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <h1 className='text-2xl font-bold text-slate-900'>{title}</h1>
        {subtitle && <p className='mt-1 text-sm text-slate-500'>{subtitle}</p>}
      </div>
      {actions && <div className='flex flex-wrap gap-2'>{actions}</div>}
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4' role='dialog' aria-modal='true' aria-label={title}>
      <div className='w-full max-w-lg rounded-xl bg-white shadow-xl'>
        <div className='flex items-center justify-between border-b border-slate-200 px-5 py-4'>
          <h2 className='text-lg font-semibold text-slate-900'>{title}</h2>
          <button type='button' className='btn-ghost px-2 py-1' onClick={onClose} aria-label='Cerrar'>
            ✕
          </button>
        </div>
        <div className='p-5'>{children}</div>
      </div>
    </div>
  );
}

export function MonthInput({ value, onChange, id = 'month' }) {
  return (
    <input id={id} type='month' className='input w-auto' value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />
  );
}
