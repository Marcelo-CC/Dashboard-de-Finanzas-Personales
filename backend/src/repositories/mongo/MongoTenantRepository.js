/**
 * Repositorio genérico sobre Mongoose que aplica automáticamente el filtro userId
 * (aislamiento de datos SaaS multiinquilino). Ningún método opera sin userId.
 */
const toPlain = (doc) => {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: _id, ...rest };
};

const PROTECTED_FIELDS = ['_id', 'id', 'userId'];

const sanitizePatch = (patch = {}) =>
  Object.fromEntries(Object.entries(patch).filter(([k, v]) => !PROTECTED_FIELDS.includes(k) && v !== undefined));

export class MongoTenantRepository {
  constructor(Model) {
    this.Model = Model;
  }

  scope(userId, filter = {}) {
    if (!userId) throw new Error('userId es obligatorio en el repositorio (aislamiento multiinquilino)');
    const { userId: _ignored, ...rest } = filter;
    return { ...rest, userId };
  }

  async findAll(userId, filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 0 } = {}) {
    const query = this.Model.find(this.scope(userId, filter)).sort(sort).skip(skip).lean();
    if (limit > 0) query.limit(limit);
    return (await query.exec()).map(toPlain);
  }

  count(userId, filter = {}) {
    return this.Model.countDocuments(this.scope(userId, filter)).exec();
  }

  async findById(userId, id) {
    return toPlain(await this.Model.findOne(this.scope(userId, { _id: id })).lean().exec());
  }

  async findOne(userId, filter) {
    return toPlain(await this.Model.findOne(this.scope(userId, filter)).lean().exec());
  }

  async create(userId, data) {
    const { _id, id, userId: _u, ...clean } = data;
    const doc = await this.Model.create({ ...clean, userId: this.scope(userId).userId });
    return toPlain(doc.toObject());
  }

  async update(userId, id, patch) {
    const doc = await this.Model.findOneAndUpdate(
      this.scope(userId, { _id: id }),
      { $set: sanitizePatch(patch) },
      { returnDocument: 'after', runValidators: true },
    ).lean().exec();
    return toPlain(doc);
  }

  async delete(userId, id) {
    return toPlain(await this.Model.findOneAndDelete(this.scope(userId, { _id: id })).lean().exec());
  }

  async updateMany(userId, filter, patch) {
    const res = await this.Model.updateMany(this.scope(userId, filter), { $set: sanitizePatch(patch) }).exec();
    return res.modifiedCount;
  }

  /** Suma `amount` agrupando por los campos indicados. Devuelve [{ ...campos, total }]. */
  async sum(userId, filter = {}, groupBy = []) {
    const _id = Object.fromEntries(groupBy.map((f) => [f, `$${f}`]));
    const rows = await this.Model.aggregate([
      { $match: this.scope(userId, filter) },
      { $group: { _id: groupBy.length ? _id : null, total: { $sum: '$amount' } } },
    ]).exec();
    return rows.map((r) => ({ ...(r._id || {}), total: r.total }));
  }
}
