import Swal from 'sweetalert2';

const base = {
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#64748b',
  reverseButtons: true,
};

/** Confirmación con SweetAlert2. Devuelve true si el usuario confirma. */
export async function confirmDialog({ title, text, confirmText = 'Confirmar', icon = 'warning', danger = false }) {
  const res = await Swal.fire({
    ...base,
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: danger ? '#dc2626' : base.confirmButtonColor,
  });
  return res.isConfirmed;
}

export const alertDialog = ({ title, text, icon = 'info' }) => Swal.fire({ ...base, title, text, icon });

/** Selector dentro de SweetAlert2 (p. ej. categoría de reemplazo). Devuelve el valor o null. */
export async function selectDialog({ title, text, options, placeholder }) {
  const res = await Swal.fire({
    ...base,
    title,
    text,
    icon: 'warning',
    input: 'select',
    inputOptions: options,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: 'Reasignar y eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    inputValidator: (v) => (!v ? 'Selecciona una categoría de reemplazo' : undefined),
  });
  return res.isConfirmed ? res.value : null;
}
