import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import { categoriesApi } from '../api/services';
import { PageHeader, Spinner, ErrorState, Field } from '../components/ui';
import { CategoryList } from '../components/CategoryList';
import { useAsyncData } from '../hooks/useAsyncData';
import { confirmDialog, selectDialog } from '../utils/alerts';

export default function CategoriesPage() {
  const { data: list, error, reload: load } = useAsyncData(() => categoriesApi.list(), []);
  const [form, setForm] = useState({ name: '', type: 'expense' });
  const [formError, setFormError] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await categoriesApi.create(form);
      toast.success(`Categoría "${form.name.trim()}" creada`);
      setForm({ ...form, name: '' });
      load();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const rename = async (c, name) => {
    try {
      await categoriesApi.rename(c.id, name);
      toast.success('Categoría actualizada');
      load();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const remove = async (c) => {
    try {
      if (c.transactionCount > 0) {
        const options = Object.fromEntries(list.filter((x) => x.type === c.type && x.id !== c.id).map((x) => [x.id, x.name]));
        if (Object.keys(options).length === 0) {
          toast.error('Crea otra categoría del mismo tipo para reasignar sus movimientos');
          return;
        }
        const replacementId = await selectDialog({
          title: `Eliminar "${c.name}"`,
          text: `Esta categoría tiene ${c.transactionCount} movimientos. Selecciona una categoría de reemplazo antes de eliminarla`,
          options,
          placeholder: 'Categoría de reemplazo',
        });
        if (!replacementId) return;
        await categoriesApi.remove(c.id, replacementId);
      } else {
        if (!(await confirmDialog({ title: `¿Eliminar "${c.name}"?`, text: 'Esta acción no se puede deshacer.', confirmText: 'Eliminar', danger: true }))) return;
        await categoriesApi.remove(c.id);
      }
      toast.success('Categoría eliminada');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title='Categorías' subtitle='Clasifica tus ingresos y gastos según tus propios hábitos' />
      <form onSubmit={create} className='card mb-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end'>
        <Field label='Nombre de la categoría' error={formError}>
          <input className={`input ${formError ? 'input-error' : ''}`} maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Ej. Mascotas' />
        </Field>
        <Field label='Tipo'>
          <select className='input' value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value='expense'>Gasto</option><option value='income'>Ingreso</option>
          </select>
        </Field>
        <button type='submit' className='btn-primary' disabled={!form.name.trim()}><FiPlus aria-hidden /> Guardar</button>
      </form>
      {error && <ErrorState message={error} onRetry={load} />}
      {!list && !error && <Spinner />}
      {list && (
        <div className='grid gap-4 md:grid-cols-2'>
          <CategoryList title='Gastos' tone='text-red-700' items={list.filter((c) => c.type === 'expense')} onRename={rename} onDelete={remove} />
          <CategoryList title='Ingresos' tone='text-emerald-700' items={list.filter((c) => c.type === 'income')} onRename={rename} onDelete={remove} />
        </div>
      )}
    </>
  );
}
