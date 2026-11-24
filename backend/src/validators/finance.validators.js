import validator from 'validator';
import { FieldErrors, REQUIRED, isBlank, parseAmount, isUuid } from './common.js';
import { MOVEMENT_TYPES, ACCOUNT_TYPES } from '../domain/constants.js';
import { isValidMonth, parseDay } from '../utils/dates.js';

const MOVEMENT_VALUES = Object.values(MOVEMENT_TYPES);
const ACCOUNT_VALUES = Object.values(ACCOUNT_TYPES);

export function validateCategory(body = {}, { partial = false } = {}) {
  const e = new FieldErrors();
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (isBlank(name)) e.add('name', REQUIRED);
    else if (!validator.isLength(name, { max: 40 })) e.add('name', 'El nombre admite como máximo 40 caracteres');
    out.name = name;
  }
  if (!partial) {
    if (isBlank(body.type)) e.add('type', REQUIRED);
    else if (!MOVEMENT_VALUES.includes(body.type)) e.add('type', 'El tipo debe ser "income" (ingreso) o "expense" (gasto)');
    out.type = body.type;
  }
  e.throwIfAny();
  return out;
}

export function validateAccount(body = {}, { partial = false } = {}) {
  const e = new FieldErrors();
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (isBlank(name)) e.add('name', REQUIRED);
    else if (!validator.isLength(name, { max: 40 })) e.add('name', 'El nombre admite como máximo 40 caracteres');
    out.name = name;
  }
  if (!partial || body.type !== undefined) {
    if (isBlank(body.type)) e.add('type', REQUIRED);
    else if (!ACCOUNT_VALUES.includes(body.type)) e.add('type', 'Tipo de cuenta no válido');
    out.type = body.type;
  }
  if (!partial || body.initialBalance !== undefined) {
    const raw = body.initialBalance ?? 0;
    const s = String(raw).trim();
    if (!validator.isFloat(s) || !validator.isDecimal(s, { decimal_digits: '0,2' })) {
      e.add('initialBalance', 'El saldo inicial debe ser un número con máximo 2 decimales');
    } else {
      out.initialBalance = Number(s);
    }
  }
  e.throwIfAny();
  return out;
}

export function validateTransaction(body = {}) {
  const e = new FieldErrors();
  const amount = parseAmount(body.amount);
  if (isBlank(body.amount) || amount === null) e.add('amount', 'El monto debe ser un número mayor a 0');
  if (isBlank(body.type)) e.add('type', REQUIRED);
  else if (!MOVEMENT_VALUES.includes(body.type)) e.add('type', 'El tipo debe ser "income" (ingreso) o "expense" (gasto)');
  const date = parseDay(String(body.date ?? ''));
  if (!date) e.add('date', 'Ingresa una fecha válida (AAAA-MM-DD)');
  if (!isUuid(body.categoryId)) e.add('categoryId', REQUIRED);
  if (!isUuid(body.accountId)) e.add('accountId', REQUIRED);
  const description = String(body.description ?? '').trim();
  if (!validator.isLength(description, { max: 120 })) e.add('description', 'La descripción admite como máximo 120 caracteres');
  e.throwIfAny();
  return { amount, type: body.type, date, categoryId: body.categoryId, accountId: body.accountId, description };
}

export function validateTransactionFilters(query = {}) {
  const e = new FieldErrors();
  const out = {};
  if (!isBlank(query.from)) {
    out.from = parseDay(String(query.from));
    if (!out.from) e.add('from', 'Fecha inicial no válida');
  }
  if (!isBlank(query.to)) {
    out.to = parseDay(String(query.to), true);
    if (!out.to) e.add('to', 'Fecha final no válida');
  }
  if (out.from && out.to && out.from > out.to) e.add('from', 'La fecha inicial no puede ser posterior a la fecha final');
  if (!isBlank(query.type) && query.type !== 'all') {
    if (!MOVEMENT_VALUES.includes(query.type)) e.add('type', 'Tipo de movimiento no válido');
    else out.type = query.type;
  }
  if (!isBlank(query.categoryId) && query.categoryId !== 'all') {
    if (!isUuid(query.categoryId)) e.add('categoryId', 'Categoría no válida');
    else out.categoryId = query.categoryId;
  }
  out.page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  out.pageSize = Math.min(10000, Math.max(1, Number.parseInt(query.pageSize, 10) || 10));
  e.throwIfAny();
  return out;
}

export function validateBudget(body = {}) {
  const e = new FieldErrors();
  if (!isValidMonth(body.month)) e.add('month', 'El mes debe tener el formato AAAA-MM');
  const amount = parseAmount(body.amount);
  if (amount === null) e.add('amount', 'El presupuesto debe ser un monto mayor a 0');
  e.throwIfAny();
  return { month: body.month, amount };
}
