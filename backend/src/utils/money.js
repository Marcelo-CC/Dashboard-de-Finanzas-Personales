/** Redondea a 2 decimales evitando errores de coma flotante (montos en soles). */
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Porcentaje con 1 decimal (ej. 80.4). Devuelve 0 si el total es 0. */
export const percent = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);
