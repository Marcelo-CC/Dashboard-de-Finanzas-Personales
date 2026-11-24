import { AppError } from '../utils/AppError.js';
import { authorize, PERMISSIONS } from './policies.js';
import { isValidMonth, monthRange, lastMonths } from '../utils/dates.js';
import { round2, percent } from '../utils/money.js';

export class DashboardService {
  constructor({ transactions, categories, budgetService }) {
    this.transactions = transactions;
    this.categories = categories;
    this.budgetService = budgetService;
  }

  async #totals(userId, month) {
    const { start, end } = monthRange(month);
    const rows = await this.transactions.sum(userId, { date: { $gte: start, $lte: end } }, ['type']);
    const income = round2(rows.find((r) => r.type === 'income')?.total || 0);
    const expense = round2(rows.find((r) => r.type === 'expense')?.total || 0);
    return { income, expense, balance: round2(income - expense) };
  }

  #month(month) {
    if (!isValidMonth(month)) throw AppError.badRequest('El periodo debe tener el formato AAAA-MM');
    return month;
  }

  async summary(actor, month) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    this.#month(month);
    const [totals, budget] = await Promise.all([this.#totals(actor.id, month), this.budgetService.status(actor, month)]);
    return {
      month,
      ...totals,
      budget,
      negativeBalance: totals.balance < 0,
      message: totals.balance < 0 ? 'Tus gastos superan tus ingresos este mes' : null,
    };
  }

  async charts(actor, month, months = 6) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    this.#month(month);
    const n = Math.min(12, Math.max(1, Number(months) || 6));
    const labels = lastMonths(month, n);
    const series = await Promise.all(labels.map((m) => this.#totals(actor.id, m)));
    let acc = 0;
    const cumulativeBalance = series.map((s) => (acc = round2(acc + s.balance)));

    const { start, end } = monthRange(month);
    const [byCategory, categories] = await Promise.all([
      this.transactions.sum(actor.id, { type: 'expense', date: { $gte: start, $lte: end } }, ['categoryId']),
      this.categories.findAll(actor.id),
    ]);
    const names = new Map(categories.map((c) => [c.id, c.name]));
    const totalExpense = round2(byCategory.reduce((s, r) => s + r.total, 0));
    const distribution = byCategory
      .map((r) => ({
        categoryId: r.categoryId,
        category: names.get(r.categoryId) ?? 'Sin categoría',
        total: round2(r.total),
        percent: percent(r.total, totalExpense),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      month,
      monthly: {
        labels,
        income: series.map((s) => s.income),
        expense: series.map((s) => s.expense),
        balance: series.map((s) => s.balance),
        cumulativeBalance,
      },
      distribution: { month, total: totalExpense, items: distribution },
    };
  }
}
