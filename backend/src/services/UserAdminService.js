import { AppError } from '../utils/AppError.js';
import { authorize, PERMISSIONS } from './policies.js';
import { ROLES } from '../domain/constants.js';
import { toPublicUser } from './AuthService.js';

const LAST_ADMIN = 'Debe existir al menos un administrador activo en la plataforma';

/** Gestión de usuarios y roles (RBAC). El administrador NO accede a datos financieros de otros usuarios. */
export class UserAdminService {
  constructor({ users, clock = () => new Date() }) {
    this.users = users;
    this.now = clock;
  }

  async list(actor) {
    authorize(actor, PERMISSIONS.USERS_MANAGE);
    return (await this.users.list()).map((u) => ({ ...toPublicUser(u), roleChangedAt: u.roleChangedAt, roleChangedBy: u.roleChangedBy }));
  }

  async #target(id) {
    const u = await this.users.findById(id);
    if (!u) throw AppError.notFound('Usuario no encontrado');
    return u;
  }

  async #assertNotLastAdmin(target) {
    if (target.role !== ROLES.ADMIN || !target.active) return;
    const activeAdmins = await this.users.count({ role: ROLES.ADMIN, active: true });
    if (activeAdmins <= 1) throw AppError.conflict(LAST_ADMIN);
  }

  async changeRole(actor, id, body = {}) {
    authorize(actor, PERMISSIONS.USERS_MANAGE);
    const role = body.role;
    if (!Object.values(ROLES).includes(role)) throw AppError.badRequest('El rol debe ser ADMIN o USER', { role: 'Rol no válido' });
    const target = await this.#target(id);
    if (target.role === role) return toPublicUser(target);
    if (role === ROLES.USER) await this.#assertNotLastAdmin(target);
    const updated = await this.users.update(id, { role, roleChangedAt: this.now(), roleChangedBy: actor.id });
    return { ...toPublicUser(updated), roleChangedAt: updated.roleChangedAt, roleChangedBy: updated.roleChangedBy };
  }

  async setActive(actor, id, body = {}) {
    authorize(actor, PERMISSIONS.USERS_MANAGE);
    if (typeof body.active !== 'boolean') throw AppError.badRequest('El campo "active" debe ser verdadero o falso');
    if (id === actor.id && body.active === false) throw AppError.badRequest('No puedes desactivar tu propia cuenta');
    const target = await this.#target(id);
    if (body.active === false) await this.#assertNotLastAdmin(target);
    // Los datos financieros se conservan: solo se bloquea el inicio de sesión.
    return toPublicUser(await this.users.update(id, { active: body.active }));
  }
}
