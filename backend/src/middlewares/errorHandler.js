import { AppError } from '../utils/AppError.js';

export const notFound = (req, _res, next) => next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let body = { message: 'Error interno del servidor' };

  if (err instanceof AppError) {
    status = err.status;
    body = { message: err.message, ...(err.details ? { details: err.details } : {}) };
  } else if (err.name === 'UnauthorizedError') {
    // express-jwt: token ausente, inválido o expirado
    status = 401;
    body = {
      message: err.code === 'credentials_required' ? 'No autorizado' : 'Tu sesión ha expirado. Inicia sesión nuevamente',
    };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    body = { message: 'El cuerpo de la solicitud no es un JSON válido' };
  } else if (err.name === 'ValidationError') {
    status = 400;
    const details = Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v.message]));
    body = { message: 'Datos inválidos', details };
  } else if (err.name === 'CastError') {
    status = 404;
    body = { message: 'Recurso no encontrado' };
  } else if (err.code === 11000) {
    status = 409;
    body = { message: 'El registro ya existe' };
  }

  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(`${req.method} ${req.originalUrl}`, err);
  res.status(status).json(body);
}
