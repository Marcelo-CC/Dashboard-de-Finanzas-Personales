/**
 * Constantes del dominio. Viven fuera de los modelos para que la capa de servicios
 * no dependa de Mongoose (los servicios solo conocen repositorios y estas constantes).
 */
export const ROLES = Object.freeze({ ADMIN: 'ADMIN', USER: 'USER' });

export const MOVEMENT_TYPES = Object.freeze({ INCOME: 'income', EXPENSE: 'expense' });

export const ACCOUNT_TYPES = Object.freeze({
  CASH: 'cash',
  BANK: 'bank',
  CREDIT_CARD: 'credit_card',
  WALLET: 'wallet',
});
