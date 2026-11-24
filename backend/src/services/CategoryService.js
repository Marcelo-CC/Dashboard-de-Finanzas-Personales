import { AppError } from '../utils/AppError.js';
import { authorize, PERMISSIONS } from './policies.js';
import { validateCategory } from '../validators/finance.validators.js';
import { isUuid } from '../validators/common.js';

const keyOf = (name) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
const present = ({ nameKey, ...c }) => c;
const DUPLICATE = 'Ya existe una categoría con ese nombre';

export class CategoryService {
  constructor({ categories, transactions }) {
    this.categories = categories;
    this.transactions = transactions;
  }

  async list(actor, { type } = {}) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const filter = type === 'income' || type === 'expense' ? { type } : {};
    const list = await this.categories.findAll(actor.id, filter, { sort: { type: 1, nameKey: 1 } });
    return Promise.all(
      list.map(async (c) => ({ ...present(c), transactionCount: await this.transactions.count(actor.id, { categoryId: c.id }) })),
    );
  }

  async createDefaults(userId, defaults) {
    for (const d of defaults) {
      await this.categories.create(userId, { name: d.name, type: d.type, nameKey: keyOf(d.name) });
    }
  }

  async create(actor, body) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const data = validateCategory(body);
    const nameKey = keyOf(data.name);
    if (await this.categories.findOne(actor.id, { type: data.type, nameKey })) {
      throw AppError.conflict(DUPLICATE, { name: DUPLICATE });
    }
    return present(await this.categories.create(actor.id, { ...data, nameKey }));
  }

  async rename(actor, id, body) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const current = await this.#get(actor.id, id);
    const { name } = validateCategory(body, { partial: true });
    const nameKey = keyOf(name);
    const clash = await this.categories.findOne(actor.id, { type: current.type, nameKey, _id: { $ne: id } });
    if (clash) throw AppError.conflict(DUPLICATE, { name: DUPLICATE });
    return present(await this.categories.update(actor.id, id, { name, nameKey }));
  }

  /** Si la categoría tiene movimientos, exige una categoría de reemplazo del mismo tipo antes de eliminarla. */
  async remove(actor, id, { replacementId } = {}) {
    authorize(actor, PERMISSIONS.FINANCE_OWN);
    const current = await this.#get(actor.id, id);
    const count = await this.transactions.count(actor.id, { categoryId: id });
    if (count > 0) {
      if (!replacementId) {
        throw AppError.conflict(
          `Esta categoría tiene ${count} movimientos. Selecciona una categoría de reemplazo antes de eliminarla`,
          { transactionCount: count },
        );
      }
      if (replacementId === id) throw AppError.badRequest('La categoría de reemplazo debe ser distinta');
      const replacement = isUuid(replacementId) ? await this.categories.findById(actor.id, replacementId) : null;
      if (!replacement) throw AppError.notFound('La categoría de reemplazo no existe');
      if (replacement.type !== current.type) throw AppError.badRequest('La categoría de reemplazo debe ser del mismo tipo');
      await this.transactions.updateMany(actor.id, { categoryId: id }, { categoryId: replacementId });
    }
    await this.categories.delete(actor.id, id);
    return { deleted: true, reassigned: count };
  }

  async #get(userId, id) {
    const c = isUuid(id) ? await this.categories.findById(userId, id) : null;
    if (!c) throw AppError.notFound('Recurso no encontrado');
    return c;
  }
}
