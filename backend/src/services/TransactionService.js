import { AppError } from '../utils/AppError.js';
import { authorize, PERMISSIONS } from './policies.js';
import { validateTransaction, validateTransactionFilters } from '../validators/finance.validators.js';
import { isUuid } from '../validators/common.js';
import { monthOf } from '../utils/dates.js';
import { round2 } from '../utils/money.js';

export class TransactionService {
  constructor({ transactions, categories, accounts, accountService, budgetService }) {
    this.transactions = transactions;
    this.categories = categories;
    this.accounts = accounts;
    this.accountService = accountService;
    this.budgetService = budgetService;
  }

  #buildFilter(f) {
    const filter = {};
    if (f.from || f.to) {
      filter.date = {};
      if (f.from) filter.date.$gte = f.from;
      if (f.to) filter.date.$lte = f.to;
    }
    if (f.type) filter.type = f.type;
    if (f.categoryId) filter.categoryId = f.categoryId;
    return filter;
  }

  async #lookups(userId) {
    const [cats, accs] = await Promise.all([this.categories.findAll(userId), this.accounts.findAll(userId)]);
    return {
      cat: new Map(cats.map((c) => [c.id, c.name])),
      acc: new Map(accs.map((a) => [a.id, a.name])),
    };
  }

  #enrich(t, { cat, acc }) {
    return { ...t, categoryName: cat.get(t.categoryId) ?? '—', accountName: acc.get(t.accountId) ?? '—' };
  }

  /** Historial paginado (10 por página), filtrado por fechas, tipo y categoría, del más reciente al más antiguo. */
  async list(actor, query) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const f = validateTransactionFilters(query);
    const filter = this.#buildFilter(f);
    const [total, rows, sums, lookups] = await Promise.all([
      this.transactions.count(actor.id, filter),
      this.transactions.findAll(actor.id, filter, {
        sort: { date: -1, createdAt: -1 },
        skip: (f.page - 1) * f.pageSize,
        limit: f.pageSize,
      }),
      this.transactions.sum(actor.id, filter, ['type']),
      this.#lookups(actor.id),
    ]);
    const income = round2(sums.find((s) => s.type === 'income')?.total || 0);
    const expense = round2(sums.find((s) => s.type === 'expense')?.total || 0);
    return {
      items: rows.map((t) => this.#enrich(t, lookups)),
      page: f.page,
      pageSize: f.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
      totals: { income, expense, net: round2(income - expense) },
    };
  }

  async #assertReferences(userId, data) {
    const [category, account] = await Promise.all([
      this.categories.findById(userId, data.categoryId),
      this.accounts.findById(userId, data.accountId),
    ]);
    if (!category) throw AppError.badRequest('La categoría seleccionada no existe', { categoryId: 'La categoría seleccionada no existe' });
    if (!account) throw AppError.badRequest('La cuenta seleccionada no existe', { accountId: 'La cuenta seleccionada no existe' });
    if (category.type !== data.type) {
      throw AppError.badRequest('La categoría no corresponde al tipo de movimiento', {
        categoryId: 'La categoría no corresponde al tipo de movimiento',
      });
    }
  }

  async #result(actor, t) {
    const lookups = await this.#lookups(actor.id);
    const accountBalance = await this.accountService.balanceOf(actor.id, t.accountId);
    const budgetAlert = t.type === 'expense' ? await this.budgetService.alertAfterExpense(actor, monthOf(t.date), t.amount) : null;
    return { transaction: this.#enrich(t, lookups), accountBalance, budgetAlert };
  }

  async create(actor, body) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const data = validateTransaction(body); // userId del body se ignora: el propietario sale del token
    await this.#assertReferences(actor.id, data);
    const created = await this.transactions.create(actor.id, data);
    return this.#result(actor, created);
  }

  async update(actor, id, body) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    await this.#get(actor.id, id);
    const data = validateTransaction(body);
    await this.#assertReferences(actor.id, data);
    const updated = await this.transactions.update(actor.id, id, data);
    return this.#result(actor, updated);
  }

  async getOne(actor, id) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    return this.#enrich(await this.#get(actor.id, id), await this.#lookups(actor.id));
  }

  async remove(actor, id) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const t = await this.#get(actor.id, id);
    await this.transactions.delete(actor.id, id);
    return { deleted: true, accountBalance: await this.accountService.balanceOf(actor.id, t.accountId) };
  }

  /** 404 tanto si no existe como si pertenece a otro usuario: no se revela información ajena. */
  async #get(userId, id) {
    const t = isUuid(id) ? await this.transactions.findById(userId, id) : null;
    if (!t) throw AppError.notFound('Recurso no encontrado');
    return t;
  }
}
