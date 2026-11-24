import { AppError } from '../utils/AppError.js';

/** Barrera temprana por rol a nivel de ruta. La autorización definitiva vive en la capa de servicios (policies.js). */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!roles.includes(req.user.role)) return next(AppError.forbidden());
  return next();
};
