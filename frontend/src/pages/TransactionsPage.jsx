import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiFileText, FiDownload, FiInbox } from 'react-icons/fi';
import { transactionsApi, categoriesApi, accountsApi } from '../api/services';
import { PageHeader, Spinner, ErrorState, EmptyState, Modal } from '../components/ui';
import { TransactionForm } from '../components/TransactionForm';
import { confirmDialog, alertDialog } from '../utils/alerts';
import { formatDate, formatMoney, TYPE_LABEL, currentMonth } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { PAGE_SIZE } from '../config';

const EMPTY_FILTERS = { from: '', to: '', type: 'all', categoryId: 'all' };

export default function TransactionsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS); // lo que el usuario edita
  const [applied, setApplied] = useState(EMPTY_FILTERS); // lo que se consulta
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [modal, setModal] = useState({ open: false, editing: null, errors: {} });
  const [exporting, setExporting] = useState(false);

  const rangeInvalid = filters.from && filters.to && filters.from > filters.to;
  const hasFilters = JSON.stringify(applied) !== JSON.stringify(EMPTY_FILTERS);

  const loadRefs = useCallback(async () => {
    const [c, a] = await Promise.all([categoriesApi.list(), accountsApi.list()]);
    setCategories(c);
    setAccounts(a.items);
  }, []);

  const load = useCallback(async () => {
    setError('');
    setData(null);
    try {
      setData(await transactionsApi.list({ ...applied, page, pageSize: PAGE_SIZE }));
    } catch {
      setError('No se pudo cargar el historial. Intenta nuevamente');
    }
  }, [applied, page]);

  useEffect(() => { loadRefs().catch(() => {}); }, [loadRefs]);

  // Filtros en tiempo real: se aplican automáticamente 300 ms después del último cambio (si el rango es válido).
  useEffect(() => {
    if (filters.from && filters.to && filters.from > filters.to) return undefined;
    const t = setTimeout(() => {
      setApplied((prev) => (JSON.stringify(prev) === JSON.stringify(filters) ? prev : filters));
      setPage((p) => (JSON.stringify(applied) === JSON.stringify(filters) ? p : 1));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const applyFilters = (e) => {
    e.preventDefault();
    if (rangeInvalid) return;
    setPage(1);
    setApplied(filters);
  };
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const notifyBudget = (alert) => {
    if (!alert?.message) return;
    if (alert.level === 'exceeded') alertDialog({ title: 'Presupuesto excedido', text: alert.message, icon: 'error' });
    else toast.warning(alert.message);
  };

  const save = async (values) => {
    const editing = modal.editing;
    // Caso de borde: gasto mayor al saldo disponible → confirmación explícita
    if (values.type === 'expense') {
      const account = accounts.find((a) => a.id === values.accountId);
      const previous = editing && editing.accountId === values.accountId && editing.type === 'expense' ? editing.amount : 0;
      if (account && account.type !== 'credit_card' && Number(values.amount) > account.balance + previous) {
        const ok = await confirmDialog({ title: 'Saldo insuficiente', text: 'El gasto supera el saldo disponible de la cuenta. ¿Deseas continuar?' });
        if (!ok) return;
      }
    }
    try {
      const res = editing ? await transactionsApi.update(editing.id, values) : await transactionsApi.create(values);
      toast.success(editing ? 'Movimiento actualizado' : 'Movimiento registrado');
      notifyBudget(res.budgetAlert);
      setModal({ open: false, editing: null, errors: {} });
      await Promise.all([load(), loadRefs()]);
    } catch (err) {
      setModal((m) => ({ ...m, errors: err.details || {} }));
      toast.error(err.message);
    }
  };

  const remove = async (t) => {
    const ok = await confirmDialog({
      title: '¿Eliminar movimiento?',
      text: `${TYPE_LABEL[t.type]} de ${formatMoney(t.amount)} del ${formatDate(t.date)}. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await transactionsApi.remove(t.id);
      toast.success('Movimiento eliminado');
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      else await load();
      await loadRefs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const doExport = async (format) => {
    setExporting(true);
    try {
      const all = await transactionsApi.list({ ...applied, page: 1, pageSize: 10000 }, { timeoutMs: 30000 });
      if (all.items.length === 0) {
        toast.info('No hay movimientos para exportar con los filtros seleccionados');
        return;
      }
      const month = (applied.from || '').slice(0, 7) || currentMonth();
      const periodLabel = applied.from || applied.to
        ? `${applied.from ? formatDate(applied.from) : 'inicio'} al ${applied.to ? formatDate(applied.to) : 'hoy'}`
        : 'Todos los movimientos';
      const payload = { items: all.items, totals: all.totals, periodLabel, userName: user.name };
      // Carga diferida: jsPDF y SheetJS solo se descargan al exportar
      const { exportPdf, exportExcel } = await import('../utils/exporters');
      if (format === 'pdf') exportPdf({ ...payload, fileName: `reporte-finanzas-${month}.pdf` });
      else exportExcel({ ...payload, fileName: `reporte-finanzas-${month}.xlsx` });
      toast.success(`Reporte ${format.toUpperCase()} generado (${all.items.length} movimientos)`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const openNew = () => {
    if (accounts.length === 0) {
      alertDialog({ title: 'Primero registra una cuenta', text: 'Necesitas al menos una cuenta o medio de pago para registrar movimientos.', icon: 'info' });
      return;
    }
    setModal({ open: true, editing: null, errors: {} });
  };

  return (
    <>
      <PageHeader
        title='Movimientos'
        subtitle='Historial de ingresos y gastos, del más reciente al más antiguo'
        actions={
          <>
            <button type='button' className='btn-secondary' onClick={() => doExport('pdf')} disabled={exporting}><FiFileText aria-hidden /> Exportar PDF</button>
            <button type='button' className='btn-secondary' onClick={() => doExport('excel')} disabled={exporting}><FiDownload aria-hidden /> Exportar Excel</button>
            <button type='button' className='btn-primary' onClick={openNew}><FiPlus aria-hidden /> Nuevo movimiento</button>
          </>
        }
      />

      <form onSubmit={applyFilters} className='card mb-4 grid gap-3 md:grid-cols-5 md:items-end' aria-label='Filtros'>
        <label><span className='label'>Desde</span><input type='date' className={`input ${rangeInvalid ? 'input-error' : ''}`} value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
        <label><span className='label'>Hasta</span><input type='date' className={`input ${rangeInvalid ? 'input-error' : ''}`} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
        <label><span className='label'>Tipo</span>
          <select className='input' value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, categoryId: 'all' })}>
            <option value='all'>Todos</option><option value='income'>Ingreso</option><option value='expense'>Gasto</option>
          </select>
        </label>
        <label><span className='label'>Categoría</span>
          <select className='input' value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
            <option value='all'>Todas</option>
            {categories.filter((c) => filters.type === 'all' || c.type === filters.type).map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({TYPE_LABEL[c.type]})</option>
            ))}
          </select>
        </label>
        <div className='flex gap-2'>
          <button type='submit' className='btn-primary flex-1' disabled={rangeInvalid}>Aplicar filtros</button>
          <button type='button' className='btn-secondary' onClick={clearFilters}>Limpiar filtros</button>
        </div>
        {rangeInvalid && <p className='field-error md:col-span-5' role='alert'>La fecha inicial no puede ser posterior a la fecha final</p>}
      </form>

      <div className='card overflow-hidden p-0'>
        {error && <div className='p-5'><ErrorState message={error} onRetry={load} /></div>}
        {!data && !error && <Spinner />}
        {data && data.total === 0 && (
          hasFilters ? (
            <EmptyState icon={<FiInbox />} title='No se encontraron movimientos con los filtros seleccionados' />
          ) : (
            <EmptyState icon={<FiInbox />} title='Aún no tienes movimientos registrados' action={<button type='button' className='btn-primary' onClick={openNew}>Registrar mi primer movimiento</button>} />
          )
        )}
        {data && data.total > 0 && (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-slate-200'>
              <thead className='bg-slate-50'>
                <tr>
                  <th className='table-th'>Fecha</th><th className='table-th'>Tipo</th><th className='table-th'>Categoría</th>
                  <th className='table-th'>Cuenta</th><th className='table-th'>Descripción</th><th className='table-th text-right'>Monto</th>
                  <th className='table-th'><span className='sr-only'>Acciones</span></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {data.items.map((t) => (
                  <tr key={t.id} className='hover:bg-slate-50'>
                    <td className='table-td whitespace-nowrap'>{formatDate(t.date)}</td>
                    <td className='table-td'>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{TYPE_LABEL[t.type]}</span>
                    </td>
                    <td className='table-td'>{t.categoryName}</td>
                    <td className='table-td'>{t.accountName}</td>
                    <td className='table-td text-slate-500'>{t.description || '—'}</td>
                    <td className={`table-td whitespace-nowrap text-right font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatMoney(t.amount)}
                    </td>
                    <td className='table-td whitespace-nowrap text-right'>
                      <button type='button' className='btn-ghost px-2' onClick={() => setModal({ open: true, editing: t, errors: {} })} aria-label='Editar'><FiEdit2 /></button>
                      <button type='button' className='btn-ghost px-2 text-red-600' onClick={() => remove(t)} aria-label='Eliminar'><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className='bg-slate-50 text-sm'>
                <tr>
                  <td className='table-td font-semibold' colSpan={5}>
                    Total {hasFilters ? 'filtrado' : 'general'} ({data.total} movimientos) · Ingresos {formatMoney(data.totals.income)} · Gastos {formatMoney(data.totals.expense)}
                  </td>
                  <td className={`table-td text-right font-bold ${data.totals.net < 0 ? 'text-red-700' : 'text-slate-900'}`}>{formatMoney(data.totals.net)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {data && data.total > 0 && (
          <div className='flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm'>
            <span className='text-slate-600'>Página {data.page} de {data.totalPages}</span>
            <div className='flex gap-2'>
              <button type='button' className='btn-secondary' disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
              <button type='button' className='btn-secondary' disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal.open} title={modal.editing ? 'Editar movimiento' : 'Nuevo movimiento'} onClose={() => setModal({ open: false, editing: null, errors: {} })}>
        <TransactionForm
          key={modal.editing?.id || 'new'}
          initial={modal.editing}
          categories={categories}
          accounts={accounts}
          serverErrors={modal.errors}
          onSubmit={save}
          onCancel={() => setModal({ open: false, editing: null, errors: {} })}
        />
      </Modal>
    </>
  );
}
