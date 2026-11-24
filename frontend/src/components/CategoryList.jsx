import { useState } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

/** Lista reutilizable de categorías de un tipo, con edición en línea y eliminación. */
export function CategoryList({ title, items, onRename, onDelete, tone }) {
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const start = (c) => { setEditing(c.id); setName(c.name); };
  const save = async (c) => { if (await onRename(c, name)) setEditing(null); };

  return (
    <div className='card'>
      <h2 className={`mb-3 font-semibold ${tone}`}>{title} <span className='text-sm font-normal text-slate-400'>({items.length})</span></h2>
      <ul className='divide-y divide-slate-100'>
        {items.map((c) => (
          <li key={c.id} className='flex items-center justify-between gap-2 py-2'>
            {editing === c.id ? (
              <>
                <input className='input' value={name} onChange={(e) => setName(e.target.value)} aria-label='Nuevo nombre' autoFocus />
                <button type='button' className='btn-ghost px-2 text-emerald-600' onClick={() => save(c)} aria-label='Guardar'><FiCheck /></button>
                <button type='button' className='btn-ghost px-2' onClick={() => setEditing(null)} aria-label='Cancelar'><FiX /></button>
              </>
            ) : (
              <>
                <div>
                  <p className='text-sm font-medium text-slate-800'>{c.name}</p>
                  <p className='text-xs text-slate-400'>{c.transactionCount} movimientos</p>
                </div>
                <div>
                  <button type='button' className='btn-ghost px-2' onClick={() => start(c)} aria-label={`Renombrar ${c.name}`}><FiEdit2 /></button>
                  <button type='button' className='btn-ghost px-2 text-red-600' onClick={() => onDelete(c)} aria-label={`Eliminar ${c.name}`}><FiTrash2 /></button>
                </div>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && <li className='py-4 text-sm text-slate-400'>Sin categorías</li>}
      </ul>
    </div>
  );
}
