/** Tarjeta reutilizable de indicador (KPI) con ícono y tono de color. */
export function KpiCard({ label, value, icon: Icon, tone }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className='card flex items-center gap-4'>
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${tones[tone]}`}>
        <Icon aria-hidden />
      </span>
      <div>
        <p className='text-sm text-slate-500'>{label}</p>
        <p className={`text-2xl font-bold ${tone === 'red' && value.startsWith('S/ -') ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      </div>
    </div>
  );
}
