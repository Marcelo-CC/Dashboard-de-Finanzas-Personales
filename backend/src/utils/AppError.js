/**
 * Error de dominio con código HTTP. Los servicios lanzan AppError y el
 * middleware errorHandler lo traduce a una respuesta JSON uniforme.
 */
export class AppError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) { return new AppError(400, message, details); }
  static unauthorized(message = 'No autorizado') { return new AppError(401, message); }
  static forbidden(message = 'No tienes permisos para realizar esta acción') { return new AppError(403, message); }
  static notFound(message = 'Recurso no encontrado') { return new AppError(404, message); }
  static conflict(message, details) { return new AppError(409, message, details); }
  static locked(message) { return new AppError(423, message); }
}
