import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/services';
import { Field } from '../../components/ui';
import { AuthShell } from './AuthShell';
import { PASSWORD_RULE, isStrongPassword } from '../../utils/password';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const weakPassword = form.password.length > 0 && !isStrongPassword(form.password);
  const mismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const canSubmit = form.name.trim() && form.email.trim() && isStrongPassword(form.password) && !mismatch && form.confirmPassword;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    try {
      await authApi.register(form);
      toast.success('Cuenta creada correctamente');
      navigate('/login');
    } catch (err) {
      // Se conservan los datos ingresados excepto la contraseña
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
      setErrors({ ...err.details, general: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell
      title='Crear cuenta'
      subtitle='Tu espacio financiero propio y privado'
      footer={<>¿Ya tienes cuenta? <Link className='font-semibold text-white underline' to='/login'>Inicia sesión</Link></>}
    >
      <form onSubmit={onSubmit} className='space-y-4' noValidate>
        <Field label='Nombre' error={errors.name}>
          <input className='input' value={form.name} onChange={set('name')} autoComplete='name' />
        </Field>
        <Field label='Correo electrónico' error={errors.email}>
          <input className='input' type='email' value={form.email} onChange={set('email')} autoComplete='email' />
        </Field>
        <Field label='Contraseña' error={weakPassword ? PASSWORD_RULE : errors.password} hint='Mínimo 8 caracteres, una mayúscula, un número y un símbolo'>
          <input className={`input ${weakPassword ? 'input-error' : ''}`} type='password' value={form.password} onChange={set('password')} autoComplete='new-password' />
        </Field>
        <Field label='Confirmar contraseña' error={mismatch ? 'Las contraseñas no coinciden' : errors.confirmPassword}>
          <input className={`input ${mismatch ? 'input-error' : ''}`} type='password' value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete='new-password' />
        </Field>
        {errors.general && <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700' role='alert'>{errors.general}</p>}
        <button type='submit' className='btn-primary w-full' disabled={!canSubmit || sending}>
          {sending ? 'Registrando…' : 'Registrarme'}
        </button>
      </form>
    </AuthShell>
  );
}
