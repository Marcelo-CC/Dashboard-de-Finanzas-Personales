import validator from 'validator';
import { FieldErrors, REQUIRED, isBlank, isStrongPassword, PASSWORD_RULE_MESSAGE } from './common.js';

export function validateRegister(body = {}) {
  const e = new FieldErrors();
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  if (isBlank(name)) e.add('name', REQUIRED);
  else if (!validator.isLength(name, { min: 2, max: 80 })) e.add('name', 'El nombre debe tener entre 2 y 80 caracteres');
  if (isBlank(email)) e.add('email', REQUIRED);
  else if (!validator.isEmail(email)) e.add('email', 'Ingresa un correo electrónico válido');
  if (isBlank(body.password)) e.add('password', REQUIRED);
  else if (!isStrongPassword(body.password)) e.add('password', PASSWORD_RULE_MESSAGE);
  if (body.password !== body.confirmPassword) e.add('confirmPassword', 'Las contraseñas no coinciden');
  e.throwIfAny();
  return { name, email, password: body.password };
}

export function validateLogin(body = {}) {
  const e = new FieldErrors();
  const email = String(body.email ?? '').trim().toLowerCase();
  if (isBlank(email)) e.add('email', REQUIRED);
  if (isBlank(body.password)) e.add('password', REQUIRED);
  e.throwIfAny();
  return { email, password: String(body.password) };
}

export function validateForgot(body = {}) {
  const e = new FieldErrors();
  const email = String(body.email ?? '').trim().toLowerCase();
  if (isBlank(email)) e.add('email', REQUIRED);
  else if (!validator.isEmail(email)) e.add('email', 'Ingresa un correo electrónico válido');
  e.throwIfAny();
  return { email };
}

export function validateReset(body = {}) {
  const e = new FieldErrors();
  if (isBlank(body.token)) e.add('token', 'El enlace de restablecimiento no es válido');
  if (isBlank(body.password)) e.add('password', REQUIRED);
  else if (!isStrongPassword(body.password)) e.add('password', PASSWORD_RULE_MESSAGE);
  if (body.password !== body.confirmPassword) e.add('confirmPassword', 'Las contraseñas no coinciden');
  e.throwIfAny();
  return { token: String(body.token), password: body.password };
}
