import { useState } from 'react';
import { toast } from 'react-toastify';
import { Field } from './ui';
import { ACCOUNT_TYPE_LABEL } from '../utils/format';

/** Formulario reutilizable para crear o editar una cuenta / medio de pago. */
export function AccountForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: initial?.name || '', type: initial?.type || '', initialBalance: String(initial?.initialBalance ?? '0') });
  const [errors, setErrors] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Este campo es obligatorio';
    if (!form.type) errs.type = 'Este campo es obligatorio';
    if (!/^-?\d+(\.\d{1,2})?$/.test(form.initialBalance.trim())) errs.initialBalance = 'Ingresa un número con máximo 2 decimales';
    else if (Number(form.initialBalance) < 0 && form.type !== 'credit_card') errs.initialBalance = 'Solo las tarjetas de crédito pueden registrar un saldo inicial negativo';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await onSubmit({ ...form, initialBalance: form.initialBalance.trim() });
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    }
  };
  return (
    <form onSubmit={submit} className='space-y-4' noValidate>
      <Field label='Nombre' error={errors.name}>
        <input className={`input ${errors.name ? 'input-error' : ''}`} maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Ej. Yape' />
      </Field>
      <Field label='Tipo' error={errors.type}>
        <select className={`input ${errors.type ? 'input-error' : ''}`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value=''>Selecciona…</option>
          {Object.entries(ACCOUNT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <Field label='Saldo inicial (S/)' error={errors.initialBalance} hint='Para tarjetas de crédito, ingresa la deuda como monto negativo (ej. -350.00)'>
        <input className={`input ${errors.initialBalance ? 'input-error' : ''}`} inputMode='decimal' value={form.initialBalance} onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} />
      </Field>
      <div className='flex justify-end gap-2'>
        <button type='button' className='btn-secondary' onClick={onCancel}>Cancelar</button>
        <button type='submit' className='btn-primary'>Guardar</button>
      </div>
    </form>
  );
}
