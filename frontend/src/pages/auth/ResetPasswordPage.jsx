import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/services';
import { Field, Spinner } from '../../components/ui';
import { AuthShell } from './AuthShell';
import { PASSWORD_RULE, isStrongPassword } from '../../utils/password';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [state, setState] = useState({ checking: true, invalid: '' });
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Al abrir el enlace se verifica que siga vigente (expira a los 30 minutos y es de un solo uso).
  useEffect(() => {
    authApi
      .verifyResetToken(token)
      .then(() => setState({ checking: false, invalid: '' }))
      .catch((err) => setState({ checking: false, invalid: err.message }));
  }, [token]);

  const mismatch = form.confirmPassword && form.password !== form.confirmPassword;
  const weak = form.password && !isStrongPassword(form.password);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden');
    setSending(true);
    setError('');
    try {
      const res = await authApi.resetPassword({ token, ...form });
      toast.success(res.message);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
    return undefined;
  };

  return (
    <AuthShell title='Restablecer contraseña' footer={<Link className='font-semibold text-white underline' to='/login'>Volver al inicio de sesión</Link>}>
      {state.checking && <Spinner label='Verificando enlace…' />}
      {!state.checking && state.invalid && (
        <div className='space-y-4 text-center'>
          <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700' role='alert'>{state.invalid}</p>
          <Link to='/recuperar-contrasena' className='btn-primary'>Reenviar enlace</Link>
        </div>
      )}
      {!state.checking && !state.invalid && (
        <form onSubmit={onSubmit} className='space-y-4' noValidate>
          <Field label='Nueva contraseña' error={weak ? PASSWORD_RULE : undefined}>
            <input className='input' type='password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete='new-password' />
          </Field>
          <Field label='Confirmar nueva contraseña' error={mismatch ? 'Las contraseñas no coinciden' : undefined}>
            <input className='input' type='password' value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} autoComplete='new-password' />
          </Field>
          {error && <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700' role='alert'>{error}</p>}
          <button type='submit' className='btn-primary w-full' disabled={sending || weak || mismatch || !form.password}>
            {sending ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
