import { v4 as uuidv4 } from 'uuid';
import { matches, sortDocs } from './match.js';

const clone = (d) => (d ? structuredClone(d) : null);

const USER_DEFAULTS = {
  role: 'USER',
  active: true,
  failedLoginAttempts: 0,
  lockUntil: null,
  resetTokenHash: null,
  resetTokenExpires: null,
  roleChangedAt: null,
  roleChangedBy: null,
};

export class MemoryUserRepository {
  constructor() {
    this.docs = new Map();
  }

  async findById(id) { return clone(this.docs.get(id)); }

  async findByEmail(email) {
    const e = String(email).toLowerCase();
    return clone([...this.docs.values()].find((u) => u.email === e));
  }

  async findOne(filter) { return clone([...this.docs.values()].find((u) => matches(u, filter))); }

  async create(data) {
    const now = new Date();
    const doc = { ...USER_DEFAULTS, ...data, email: String(data.email).toLowerCase(), id: uuidv4(), createdAt: now, updatedAt: now };
    this.docs.set(doc.id, doc);
    return clone(doc);
  }

  async update(id, patch) {
    const current = this.docs.get(id);
    if (!current) return null;
    const { id: _i, _id, ...clean } = patch;
    Object.assign(current, clean, { updatedAt: new Date() });
    return clone(current);
  }

  async list() { return sortDocs([...this.docs.values()], { createdAt: 1 }).map(clone); }

  async count(filter = {}) { return [...this.docs.values()].filter((u) => matches(u, filter)).length; }
}
