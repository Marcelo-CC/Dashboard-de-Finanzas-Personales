import { v4 as uuidv4 } from 'uuid';
import { matches, sortDocs } from './match.js';

const clone = (d) => (d ? structuredClone(d) : null);
const PROTECTED_FIELDS = ['_id', 'id', 'userId'];

/** Implementación en memoria del mismo contrato que MongoTenantRepository (pruebas y modo demo). */
export class MemoryTenantRepository {
  constructor(defaults = {}) {
    this.docs = new Map();
    this.defaults = defaults;
  }

  scope(userId, filter = {}) {
    if (!userId) throw new Error('userId es obligatorio en el repositorio (aislamiento multiinquilino)');
    const { userId: _ignored, ...rest } = filter;
    return { ...rest, userId };
  }

  async findAll(userId, filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 0 } = {}) {
    const scoped = this.scope(userId, filter);
    const list = sortDocs([...this.docs.values()].filter((d) => matches(d, scoped)), sort);
    const page = list.slice(skip, limit > 0 ? skip + limit : undefined);
    return page.map(clone);
  }

  async count(userId, filter = {}) {
    const scoped = this.scope(userId, filter);
    return [...this.docs.values()].filter((d) => matches(d, scoped)).length;
  }

  async findById(userId, id) {
    return this.findOne(userId, { _id: id });
  }

  async findOne(userId, filter) {
    const scoped = this.scope(userId, filter);
    return clone([...this.docs.values()].find((d) => matches(d, scoped)));
  }

  async create(userId, data) {
    const { _id, id, userId: _u, ...clean } = data;
    const now = new Date();
    const doc = { ...this.defaults, ...clean, id: uuidv4(), userId: this.scope(userId).userId, createdAt: now, updatedAt: now };
    this.docs.set(doc.id, doc);
    return clone(doc);
  }

  async update(userId, id, patch) {
    const current = [...this.docs.values()].find((d) => matches(d, this.scope(userId, { _id: id })));
    if (!current) return null;
    for (const [k, v] of Object.entries(patch)) {
      if (!PROTECTED_FIELDS.includes(k) && v !== undefined) current[k] = v;
    }
    current.updatedAt = new Date();
    return clone(current);
  }

  async delete(userId, id) {
    const current = await this.findById(userId, id);
    if (current) this.docs.delete(id);
    return current;
  }

  async updateMany(userId, filter, patch) {
    const scoped = this.scope(userId, filter);
    let n = 0;
    for (const d of this.docs.values()) {
      if (matches(d, scoped)) {
        Object.assign(d, Object.fromEntries(Object.entries(patch).filter(([k]) => !PROTECTED_FIELDS.includes(k))));
        n += 1;
      }
    }
    return n;
  }

  async sum(userId, filter = {}, groupBy = []) {
    const scoped = this.scope(userId, filter);
    const groups = new Map();
    for (const d of this.docs.values()) {
      if (!matches(d, scoped)) continue;
      const keyObj = Object.fromEntries(groupBy.map((f) => [f, d[f]]));
      const key = JSON.stringify(keyObj);
      const g = groups.get(key) || { ...keyObj, total: 0 };
      g.total += d.amount;
      groups.set(key, g);
    }
    return [...groups.values()];
  }
}
