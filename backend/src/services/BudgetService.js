import { AppError } from '../utils/AppError.js';
import { authorize, PERMISSIONS } from './policies.js';
import { validateBudget } from '../validators/finance.validators.js';
import { isValidMonth, monthRange } from '../utils/dates.js';
import { round2, percent } from '../utils/money.js';

export const WARNING_THRESHOLD = 80;

const levelOf = (pct) => (pct > 100 ? 'exceeded' : pct >= WARNING_THRESHOLD ? 'warning' : 'ok');
const fmt = (n) => `S/ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export class BudgetService {
  constructor({ budgets, transactions }) {
    this.budgets = budgets;
    this.transactions = transactions;
  }

  async upsert(actor, body) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const { month, amount } = validateBudget(body);
    const existing = await this.budgets.findOne(actor.id, { month });
    if (existing) await this.budgets.update(actor.id, existing.id, { amount });
    else await this.budgets.create(actor.id, { month, amount });
    return this.status(actor, month);
  }

  async remove(actor, month) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const existing = await this.budgets.findOne(actor.id, { month });
    if (!existing) throw AppError.notFound('No hay un presupuesto definido para ese mes');
    await this.budgets.delete(actor.id, existing.id);
    return { deleted: true };
  }

  async spentIn(userId, month) {
    const { start, end } = monthRange(month);
    const [row] = await this.transactions.sum(userId, { type: 'expense', date: { $gte: start, $lte: end } });
    return round2(row?.total || 0);
  }

  async status(actor, month) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    if (!isValidMonth(month)) throw AppError.badRequest('El mes debe tener el formato AAAA-MM');
    const [budget, spent] = await Promise.all([this.budgets.findOne(actor.id, { month }), this.spentIn(actor.id, month)]);
    if (!budget) return { month, defined: false, amount: 0, spent, percent: 0, remaining: 0, exceededBy: 0, level: 'none' };
    const pct = percent(spent, budget.amount);
    return {
      month,
      defined: true,
      amount: budget.amount,
      spent,
      percent: pct,
      remaining: round2(Math.max(0, budget.amount - spent)),
      exceededBy: round2(Math.max(0, spent - budget.amount)),
      level: levelOf(pct),
    };
  }

  /** Alerta tras registrar un gasto: 80 % al cruzar el umbral; exceso cada vez que se supera el 100 %. */
  async alertAfterExpense(actor, month, addedAmount) {
    const s = await this.status(actor, month);
    if (!s.defined) return null;
    const previousPct = percent(round2(s.spent - addedAmount), s.amount);
    let message = null;
    if (s.level === 'exceeded') message = `Has superado tu presupuesto mensual en ${fmt(s.exceededBy)}`;
    else if (s.level === 'warning' && previousPct < WARNING_THRESHOLD) message = `Has consumido el ${WARNING_THRESHOLD} % de tu presupuesto mensual`;
    return { ...s, previousPercent: previousPct, message };
  }
}
