import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { budgetsApi } from '../api/services';
import { PageHeader, Spinner, ErrorState, Field, MonthInput } from '../components/ui';
import { BudgetBar } from '../components/BudgetBar';
import { confirmDialog } from '../utils/alerts';
import { currentMonth, monthLabel } from '../utils/format';

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setStatus(null);
    setError('');
    try {
      const s = await budgetsApi.status(month);
      setStatus(s);
      setAmount(s.defined ? String(s.amount) : '');
    } catch (err) {
      setError(err.message);
    }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || Number(amount) <= 0) {
      setFormError('El presupuesto debe ser un monto mayor a 0');
      return;
    }
    try {
      setStatus(await budgetsApi.save(month, amount.trim()));
      toast.success(`Presupuesto de ${monthLabel(month)} guardado`);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const remove = async () => {
    if (!(await confirmDialog({ title: '¿Eliminar presupuesto?', text: `Se eliminará el presupuesto de ${monthLabel(month)}.`, confirmText: 'Eliminar', danger: true }))) return;
    await budgetsApi.remove(month);
    toast.success('Presupuesto eliminado');
    load();
  };

  return (
    <>
      <PageHeader title='Presupuesto mensual' subtitle='Define un límite de gastos y sigue su cumplimiento' actions={<MonthInput value={month} onChange={setMonth} />} />
      {error && <ErrorState message={error} onRetry={load} />}
      {!status && !error && <Spinner />}
      {status && (
        <div className='grid gap-4 lg:grid-cols-2'>
          <form onSubmit={save} className='card space-y-4' noValidate>
            <h2 className='font-semibold text-slate-900'>{monthLabel(month)}</h2>
            <Field label='Presupuesto de gastos (S/)' error={formError}>
              <input className={`input ${formError ? 'input-error' : ''}`} inputMode='decimal' placeholder='2500.00' value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <div className='flex gap-2'>
              <button type='submit' className='btn-primary'>Guardar</button>
              {status.defined && <button type='button' className='btn-secondary' onClick={remove}>Eliminar</button>}
            </div>
            <p className='text-xs text-slate-500'>Recibirás una alerta al consumir el 80 % y al superar el 100 % del presupuesto.</p>
          </form>
          <div className='card'>
            <h2 className='mb-4 font-semibold text-slate-900'>Seguimiento</h2>
            <BudgetBar status={status} />
          </div>
        </div>
      )}
    </>
  );
}
