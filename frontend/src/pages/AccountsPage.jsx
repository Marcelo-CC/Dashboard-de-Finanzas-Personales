import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { accountsApi } from '../api/services';
import { PageHeader, Spinner, ErrorState, Modal, EmptyState } from '../components/ui';
import { AccountForm } from '../components/AccountForm';
import { useAsyncData } from '../hooks/useAsyncData';
import { confirmDialog } from '../utils/alerts';
import { formatMoney, ACCOUNT_TYPE_LABEL } from '../utils/format';

export default function AccountsPage() {
  const { data, error, reload: load } = useAsyncData(() => accountsApi.list(), []);
  const [modal, setModal] = useState({ open: false, editing: null });

  const save = async (values) => {
    if (modal.editing) await accountsApi.update(modal.editing.id, values);
    else await accountsApi.create(values);
    toast.success(modal.editing ? 'Cuenta actualizada' : 'Cuenta registrada');
    setModal({ open: false, editing: null });
    load();
  };

  const remove = async (a) => {
    if (!(await confirmDialog({ title: `¿Eliminar "${a.name}"?`, text: 'Esta acción no se puede deshacer.', confirmText: 'Eliminar', danger: true }))) return;
    try {
      await accountsApi.remove(a.id);
      toast.success('Cuenta eliminada');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title='Cuentas y medios de pago'
        subtitle='Efectivo, cuentas bancarias, tarjetas de crédito y billeteras digitales'
        actions={<button type='button' className='btn-primary' onClick={() => setModal({ open: true, editing: null })}><FiPlus aria-hidden /> Nueva cuenta</button>}
      />
      {error && <ErrorState message={error} onRetry={load} />}
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className='card mb-4 flex items-center justify-between bg-slate-900 text-white'>
            <span className='text-sm text-slate-300'>Saldo total consolidado</span>
            <span className={`text-2xl font-bold ${data.totalBalance < 0 ? 'text-red-300' : ''}`}>{formatMoney(data.totalBalance)}</span>
          </div>
          {data.items.length === 0 ? (
            <div className='card'><EmptyState title='Aún no registras cuentas o medios de pago' /></div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {data.items.map((a) => (
                <div key={a.id} className='card'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='font-semibold text-slate-900'>{a.name}</p>
                      <p className='text-xs text-slate-500'>{ACCOUNT_TYPE_LABEL[a.type]}</p>
                    </div>
                    <div>
                      <button type='button' className='btn-ghost px-2' onClick={() => setModal({ open: true, editing: a })} aria-label={`Editar ${a.name}`}><FiEdit2 /></button>
                      <button type='button' className='btn-ghost px-2 text-red-600' onClick={() => remove(a)} aria-label={`Eliminar ${a.name}`}><FiTrash2 /></button>
                    </div>
                  </div>
                  <p className={`mt-4 text-2xl font-bold ${a.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatMoney(a.balance)}</p>
                  {a.balance < 0 && a.type === 'credit_card' && <p className='text-xs text-red-600'>Deuda pendiente</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <Modal open={modal.open} title={modal.editing ? 'Editar cuenta' : 'Nueva cuenta'} onClose={() => setModal({ open: false, editing: null })}>
        <AccountForm key={modal.editing?.id || 'new'} initial={modal.editing} onSubmit={save} onCancel={() => setModal({ open: false, editing: null })} />
      </Modal>
    </>
  );
}
