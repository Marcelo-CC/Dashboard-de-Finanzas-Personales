import validator from 'validator';
import { AppError } from '../utils/AppError.js';

/** Acumula errores por campo y lanza un 400 con todos ellos (el frontend los muestra junto a cada campo). */
export class FieldErrors {
  constructor() { this.errors = {}; }
  add(field, message) { if (!this.errors[field]) this.errors[field] = message; return this; }
  get empty() { return Object.keys(this.errors).length === 0; }
  throwIfAny(message = 'Datos inválidos') {
    if (!this.empty) throw AppError.badRequest(Object.values(this.errors)[0] || message, this.errors);
  }
}

export const REQUIRED = 'Este campo es obligatorio';

export const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

/** Monto válido: número > 0 con máximo 2 decimales. Acepta number o string numérica. */
export function parseAmount(value) {
  const s = String(value ?? '').trim();
  if (!validator.isFloat(s, { gt: 0 }) || !validator.isDecimal(s, { decimal_digits: '0,2' })) return null;
  return Number(s);
}

export const isUuid = (v) => typeof v === 'string' && validator.isUUID(v, 4);

export const PASSWORD_RULE_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo';

export const isStrongPassword = (pwd) =>
  typeof pwd === 'string' &&
  validator.isStrongPassword(pwd, { minLength: 8, minLowercase: 0, minUppercase: 1, minNumbers: 1, minSymbols: 1 });
