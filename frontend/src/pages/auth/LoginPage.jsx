import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { Field } from '../../components/ui';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const user = await login(form);
      toast.success(`Bienvenido(a), ${user.name.split(' ')[0]}`);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell
      title='Iniciar sesión'
      subtitle='Accede a tu información financiera'
      footer={<>¿No tienes cuenta? <Link className='font-semibold text-white underline' to='/registro'>Crear cuenta</Link></>}
    >
      <form onSubmit={onSubmit} className='space-y-4' noValidate>
        <Field label='Correo electrónico'>
          <input className='input' type='email' autoComplete='email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label='Contraseña'>
          <input className='input' type='password' autoComplete='current-password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        {error && <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700' role='alert'>{error}</p>}
        <button type='submit' className='btn-primary w-full' disabled={sending || !form.email || !form.password}>
          {sending ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
        <p className='text-center text-sm'>
          <Link to='/recuperar-contrasena' className='text-brand-600 hover:underline'>¿Olvidaste tu contraseña?</Link>
        </p>
      </form>
    </AuthShell>
  );
}
