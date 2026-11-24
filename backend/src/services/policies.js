import { AppError } from '../utils/AppError.js';
import { ROLES } from '../domain/constants.js';

/**
 * Políticas de autorización centralizadas (RBAC). Cada operación crítica de la capa
 * de servicios declara el permiso que necesita y se valida aquí, en un solo lugar.
 */
export const PERMISSIONS = Object.freeze({
  FINANCE_OWN: 'finance:own', // gestionar SUS propios movimientos, cuentas, categorías, presupuestos y reportes
  USERS_MANAGE: 'users:manage', // listar usuarios, cambiar roles, activar/desactivar cuentas
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [PERMISSIONS.FINANCE_OWN, PERMISSIONS.USERS_MANAGE],
  [ROLES.USER]: [PERMISSIONS.FINANCE_OWN],
});

export const can = (actor, permission) => Boolean(actor && ROLE_PERMISSIONS[actor.role]?.includes(permission));

export function authorize(actor, permission) {
  if (!actor?.id) throw AppError.unauthorized();
  if (!can(actor, permission)) throw AppError.forbidden();
  return actor;
}
