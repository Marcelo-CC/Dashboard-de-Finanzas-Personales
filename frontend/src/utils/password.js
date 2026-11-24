/** Regla de contraseña del backend replicada en el cliente para dar retroalimentación inmediata. */
export const PASSWORD_RULE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo';
export const isStrongPassword = (p) => p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);
