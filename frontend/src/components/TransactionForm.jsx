import { useMemo, useState } from 'react';
import { Field } from './ui';
import { toInputDate, today, formatMoney } from '../utils/format';

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** Formulario "Nuevo movimiento" / edición. Valida en el cliente y el backend vuelve a validar. */
export function TransactionForm({ initial, categories, accounts, onSubmit, onCancel, serverErrors = {} }) {
  const [form, setForm] = useState(() => ({
    type: initial?.type || 'expense',
    amount: initial ? String(initial.amount) : '',
    date: initial ? toInputDate(initial.date) : today(),
    categoryId: initial?.categoryId || '',
    accountId: initial?.accountId || accounts[0]?.id || '',
    description: initial?.description || '',
  }));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const cats = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);
  const amountOk = AMOUNT_RE.test(form.amount.trim()) && Number(form.amount) > 0;
  const errors = {
    amount: touched && !amountOk ? 'El monto debe ser un número mayor a 0' : serverErrors.amount,
    date: touched && !form.date ? 'Ingresa una fecha válida' : serverErrors.date,
    categoryId: touched && !form.categoryId ? 'Este campo es obligatorio' : serverErrors.categoryId,
    accountId: touched && !form.accountId ? 'Este campo es obligatorio' : serverErrors.accountId,
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'type' ? { categoryId: '' } : {}) }));

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!amountOk || !form.date || !form.categoryId || !form.accountId) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, amount: form.amount.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className='space-y-4' noValidate>
      <div className='grid grid-cols-2 gap-2' role='radiogroup' aria-label='Tipo de movimiento'>
        {[['expense', 'Gasto'], ['income', 'Ingreso']].map(([value, label]) => (
          <button
            key={value}
            type='button'
            role='radio'
            aria-checked={form.type === value}
            onClick={() => set('type')({ target: { value } })}
            className={`btn ${form.type === value ? (value === 'expense' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white') : 'border border-slate-300 bg-white text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field label='Monto (S/)' error={errors.amount}>
          <input className={`input ${errors.amount ? 'input-error' : ''}`} inputMode='decimal' placeholder='0.00' value={form.amount} onChange={set('amount')} />
        </Field>
        <Field label='Fecha' error={errors.date}>
          <input className='input' type='date' value={form.date} onChange={set('date')} />
        </Field>
        <Field label='Categoría' error={errors.categoryId}>
          <select className={`input ${errors.categoryId ? 'input-error' : ''}`} value={form.categoryId} onChange={set('categoryId')}>
            <option value=''>Selecciona…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label='Cuenta' error={errors.accountId}>
          <select className={`input ${errors.accountId ? 'input-error' : ''}`} value={form.accountId} onChange={set('accountId')}>
            <option value=''>Selecciona…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.balance)})</option>)}
          </select>
        </Field>
      </div>
      <Field label='Descripción (opcional)'>
        <input className='input' maxLength={120} value={form.description} onChange={set('description')} placeholder='Ej. Almuerzo' />
      </Field>
      <div className='flex justify-end gap-2 pt-2'>
        <button type='button' className='btn-secondary' onClick={onCancel}>Cancelar</button>
        <button type='submit' className='btn-primary' disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
