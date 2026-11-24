import { expressjwt } from 'express-jwt';
import { AppError } from '../utils/AppError.js';

/**
 * 1) express-jwt valida firma y expiración del JWT (Authorization: Bearer <token>).
 * 2) Se carga el usuario desde la base de datos: el rol vigente y el estado activo
 *    se toman de la BD, no del token (un cambio de rol o desactivación aplica de inmediato).
 */
export function authenticate({ jwtSecret, users }) {
  const verifyJwt = expressjwt({ secret: jwtSecret, algorithms: ['HS256'] });
  const loadUser = async (req, _res, next) => {
    try {
      const user = await users.findById(req.auth?.sub);
      if (!user || !user.active) throw AppError.unauthorized('Tu sesión ha expirado. Inicia sesión nuevamente');
      req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
      next();
    } catch (err) {
      next(err);
    }
  };
  return [verifyJwt, loadUser];
}
