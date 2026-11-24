import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiTarget } from 'react-icons/fi';
import { dashboardApi } from '../api/services';
import { PageHeader, Spinner, ErrorState, EmptyState, MonthInput } from '../components/ui';
import { BudgetBar } from '../components/BudgetBar';
import { KpiCard } from '../components/KpiCard';
import { IncomeExpenseChart, BalanceChart, CategoryChart } from '../components/charts';
import { currentMonth, formatMoney, monthLabel } from '../utils/format';

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState({ summary: '', charts: '' });

  const load = useCallback(async () => {
    setSummary(null);
    setCharts(null);
    setError({ summary: '', charts: '' });
    const [s, c] = await Promise.allSettled([dashboardApi.summary(month), dashboardApi.charts(month, 6)]);
    if (s.status === 'fulfilled') setSummary(s.value);
    else setError((e) => ({ ...e, summary: 'No se pudieron cargar los indicadores' }));
    if (c.status === 'fulfilled') setCharts(c.value);
    else setError((e) => ({ ...e, charts: 'No fue posible cargar la información del gráfico' }));
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const negative = summary?.balance < 0;

  return (
    <>
      <PageHeader
        title='Dashboard'
        subtitle={`Resumen financiero de ${monthLabel(month)}`}
        actions={<><label htmlFor='period' className='sr-only'>Periodo</label><MonthInput id='period' value={month} onChange={setMonth} /></>}
      />

      {error.summary && <ErrorState message={error.summary} onRetry={load} />}
      {!summary && !error.summary && <Spinner />}
      {summary && (
        <>
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <KpiCard label='Ingresos' value={formatMoney(summary.income)} icon={FiTrendingUp} tone='green' />
            <KpiCard label='Gastos' value={formatMoney(summary.expense)} icon={FiTrendingDown} tone='red' />
            <KpiCard label='Balance' value={formatMoney(summary.balance)} icon={FiActivity} tone={negative ? 'red' : 'blue'} />
            <KpiCard label='Presupuesto consumido' value={summary.budget.defined ? `${summary.budget.percent} %` : '—'} icon={FiTarget} tone='amber' />
          </div>
          {negative && (
            <p className='mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700' role='alert'>
              {summary.message}
            </p>
          )}
          <div className='card mt-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='font-semibold text-slate-900'>Presupuesto mensual</h2>
              <Link to='/presupuesto' className='text-sm text-brand-600 hover:underline'>Gestionar</Link>
            </div>
            <BudgetBar status={summary.budget} />
          </div>
        </>
      )}

      <section className='mt-6' aria-labelledby='graficos'>
        <h2 id='graficos' className='mb-3 text-lg font-semibold text-slate-900'>Gráficos</h2>
        {error.charts && <ErrorState message={error.charts} onRetry={load} />}
        {!charts && !error.charts && <Spinner />}
        {charts && (
          <div className='grid gap-4 xl:grid-cols-2'>
            <div className='card'>
              <h3 className='mb-3 text-sm font-semibold text-slate-700'>Ingresos vs. gastos (últimos 6 meses)</h3>
              <div className='h-72'><IncomeExpenseChart monthly={charts.monthly} /></div>
            </div>
            <div className='card'>
              <h3 className='mb-3 text-sm font-semibold text-slate-700'>Evolución del balance</h3>
              <div className='h-72'><BalanceChart monthly={charts.monthly} /></div>
            </div>
            <div className='card xl:col-span-2'>
              <h3 className='mb-3 text-sm font-semibold text-slate-700'>Distribución de gastos por categoría — {monthLabel(month)}</h3>
              {charts.distribution.items.length === 0 ? (
                <EmptyState title='No hay gastos registrados en este periodo' />
              ) : (
                <div className='h-80'><CategoryChart distribution={charts.distribution} /></div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
