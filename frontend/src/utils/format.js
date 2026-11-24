import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.locale('es');

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** S/ 1,234.56 · S/ -250.00 */
export const formatMoney = (n) => `S/ ${money.format(Number(n) || 0)}`;

/** Las fechas de movimientos se guardan en UTC (día contable): se muestran en UTC para no correr el día. */
export const formatDate = (d) => dayjs.utc(d).format('DD/MM/YYYY');
export const toInputDate = (d) => dayjs.utc(d).format('YYYY-MM-DD');
export const today = () => dayjs().format('YYYY-MM-DD');
export const currentMonth = () => dayjs().format('YYYY-MM');

/** '2026-10' → 'Octubre 2026' */
export const monthLabel = (m) => {
  const s = dayjs(`${m}-01`).format('MMMM YYYY');
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const shortMonthLabel = (m) => {
  const s = dayjs(`${m}-01`).format('MMM YY');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const TYPE_LABEL = { income: 'Ingreso', expense: 'Gasto' };
export const ACCOUNT_TYPE_LABEL = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  credit_card: 'Tarjeta de crédito',
  wallet: 'Billetera digital',
};
