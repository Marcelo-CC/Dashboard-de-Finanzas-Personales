import { formatMoney } from '../utils/format';

const COLORS = { ok: 'bg-emerald-500', warning: 'bg-amber-400', exceeded: 'bg-red-500', none: 'bg-slate-300' };

/** Barra de progreso del presupuesto: verde < 80 %, amarillo 80–100 %, rojo > 100 %. */
export function BudgetBar({ status }) {
  if (!status?.defined) return <p className='text-sm text-slate-500'>No has definido un presupuesto para este mes.</p>;
  const width = Math.min(100, status.percent);
  return (
    <div>
      <div className='mb-2 flex items-center justify-between text-sm'>
        <span className='font-medium text-slate-700'>
          {formatMoney(status.spent)} de {formatMoney(status.amount)} ({status.percent} %)
        </span>
        {status.level === 'exceeded' ? (
          <span className='font-semibold text-red-600'>Excedido en {formatMoney(status.exceededBy)}</span>
        ) : (
          <span className='text-slate-500'>Disponible: {formatMoney(status.remaining)}</span>
        )}
      </div>
      <div className='h-3 w-full overflow-hidden rounded-full bg-slate-100' role='progressbar' aria-valuenow={status.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all ${COLORS[status.level]}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
