import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/**
 * Manejo estandarizado de fechas y zonas horarias con Day.js.
 * - Las fechas contables de los movimientos (día AAAA-MM-DD) se guardan en UTC a las 00:00:00,
 *   así un movimiento del 30/11 es del 30/11 sin importar la zona del servidor o del navegador.
 * - "Hoy" y "el mes actual" se calculan en la zona horaria del negocio (APP_TIMEZONE, por defecto
 *   America/Lima): a las 23:30 del 30/11 en Lima ya es 01/12 en UTC, pero el mes actual sigue siendo noviembre.
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Lima';
const MONTH_FORMAT = 'YYYY-MM';

export const isValidMonth = (month) => typeof month === 'string' && dayjs.utc(month, MONTH_FORMAT, true).isValid();

export const currentMonth = (now = new Date(), tz = APP_TIMEZONE) => dayjs(now).tz(tz).format(MONTH_FORMAT);

/** Fecha de hoy (AAAA-MM-DD) en la zona horaria del negocio. */
export const today = (now = new Date(), tz = APP_TIMEZONE) => dayjs(now).tz(tz).format('YYYY-MM-DD');

/** Rango [inicio, fin] de un mes 'YYYY-MM' (primer y último milisegundo del mes, UTC). */
export function monthRange(month) {
  const m = dayjs.utc(month, MONTH_FORMAT, true);
  return { start: m.startOf('month').toDate(), end: m.endOf('month').toDate() };
}

/** Los últimos n meses terminando en `month` (inclusive), en orden cronológico. */
export function lastMonths(month, n) {
  const end = dayjs.utc(month, MONTH_FORMAT, true);
  return Array.from({ length: n }, (_, i) => end.subtract(n - 1 - i, 'month').format(MONTH_FORMAT));
}

export const monthOf = (date) => dayjs.utc(date).format(MONTH_FORMAT);

/** Convierte 'YYYY-MM-DD' (fecha contable) en Date UTC al inicio o al fin del día. Devuelve null si no es válida. */
export function parseDay(value, endOfDay = false) {
  if (typeof value !== 'string') return null;
  const d = dayjs.utc(value, 'YYYY-MM-DD', true);
  if (!d.isValid()) return null;
  return (endOfDay ? d.endOf('day') : d.startOf('day')).toDate();
}
