import { AppError } from '../utils/AppError.js';
import { authorize, PERMISSIONS } from './policies.js';
import { validateAccount } from '../validators/finance.validators.js';
import { isUuid } from '../validators/common.js';
import { ACCOUNT_TYPES } from '../domain/constants.js';
import { round2 } from '../utils/money.js';

const NEGATIVE_NOT_ALLOWED = 'Solo las tarjetas de crédito pueden registrar un saldo inicial negativo';

export class AccountService {
  constructor({ accounts, transactions }) {
    this.accounts = accounts;
    this.transactions = transactions;
  }

  /** Saldo = saldo inicial + ingresos − gastos de la cuenta. */
  async #balances(userId) {
    const rows = await this.transactions.sum(userId, {}, ['accountId', 'type']);
    const map = new Map();
    for (const r of rows) {
      const signed = r.type === 'income' ? r.total : -r.total;
      map.set(r.accountId, (map.get(r.accountId) || 0) + signed);
    }
    return map;
  }

  async list(actor) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const [accounts, movements] = await Promise.all([
      this.accounts.findAll(actor.id, {}, { sort: { createdAt: 1 } }),
      this.#balances(actor.id),
    ]);
    const items = accounts.map((a) => ({ ...a, balance: round2(a.initialBalance + (movements.get(a.id) || 0)) }));
    return { items, totalBalance: round2(items.reduce((s, a) => s + a.balance, 0)) };
  }

  async balanceOf(userId, accountId) {
    const account = await this.accounts.findById(userId, accountId);
    if (!account) return null;
    const rows = await this.transactions.sum(userId, { accountId }, ['type']);
    const net = rows.reduce((s, r) => s + (r.type === 'income' ? r.total : -r.total), 0);
    return round2(account.initialBalance + net);
  }

  async create(actor, body) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const data = validateAccount(body);
    if (data.initialBalance < 0 && data.type !== ACCOUNT_TYPES.CREDIT_CARD) {
      throw AppError.badRequest(NEGATIVE_NOT_ALLOWED, { initialBalance: NEGATIVE_NOT_ALLOWED });
    }
    const created = await this.accounts.create(actor.id, { ...data, currency: 'PEN' });
    return { ...created, balance: created.initialBalance };
  }

  async update(actor, id, body) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const current = await this.#get(actor.id, id);
    const data = validateAccount(body, { partial: true });
    const type = data.type ?? current.type;
    const initial = data.initialBalance ?? current.initialBalance;
    if (initial < 0 && type !== ACCOUNT_TYPES.CREDIT_CARD) {
      throw AppError.badRequest(NEGATIVE_NOT_ALLOWED, { initialBalance: NEGATIVE_NOT_ALLOWED });
    }
    await this.accounts.update(actor.id, id, data);
    return { ...(await this.accounts.findById(actor.id, id)), balance: await this.balanceOf(actor.id, id) };
  }

  async remove(actor, id) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    await this.#get(actor.id, id);
    const count = await this.transactions.count(actor.id, { accountId: id });
    if (count > 0) {
      throw AppError.conflict(`La cuenta tiene ${count} movimientos. Elimínalos o edítalos antes de eliminar la cuenta`, {
        transactionCount: count,
      });
    }
    await this.accounts.delete(actor.id, id);
    return { deleted: true };
  }

  async #get(userId, id) {
    const a = isUuid(id) ? await this.accounts.findById(userId, id) : null;
    if (!a) throw AppError.notFound('Recurso no encontrado');
    return a;
  }
}
