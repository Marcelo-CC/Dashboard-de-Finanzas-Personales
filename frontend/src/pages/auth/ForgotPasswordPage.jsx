import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/services';
import { Field } from '../../components/ui';
import { AuthShell } from './AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await authApi.forgotPassword(email);
      setDone(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell
      title='¿Olvidaste tu contraseña?'
      subtitle='Te enviaremos un enlace para restablecerla (válido por 30 minutos)'
      footer={<Link className='font-semibold text-white underline' to='/login'>Volver al inicio de sesión</Link>}
    >
      {done ? (
        <div className='rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800' role='status'>
          <p className='font-semibold'>{done}</p>
          <p className='mt-1'>Si el correo está registrado, recibirás un enlace de restablecimiento de un solo uso.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className='space-y-4' noValidate>
          <Field label='Correo electrónico' error={error}>
            <input className='input' type='email' value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='email' />
          </Field>
          <button type='submit' className='btn-primary w-full' disabled={!email || sending}>
            {sending ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
