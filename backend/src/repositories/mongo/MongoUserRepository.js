import { UserModel } from '../../models/index.js';

const toPlain = (doc) => {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: _id, ...rest };
};

export class MongoUserRepository {
  async findById(id) {
    return toPlain(await UserModel.findById(id).lean().exec());
  }

  async findByEmail(email) {
    return toPlain(await UserModel.findOne({ email: String(email).toLowerCase() }).lean().exec());
  }

  async findOne(filter) {
    return toPlain(await UserModel.findOne(filter).lean().exec());
  }

  async create(data) {
    const doc = await UserModel.create(data);
    return toPlain(doc.toObject());
  }

  async update(id, patch) {
    const { _id, id: _i, ...clean } = patch;
    return toPlain(
      await UserModel.findByIdAndUpdate(id, { $set: clean }, { returnDocument: 'after', runValidators: true }).lean().exec(),
    );
  }

  async list() {
    return (await UserModel.find().sort({ createdAt: 1 }).lean().exec()).map(toPlain);
  }

  count(filter = {}) {
    return UserModel.countDocuments(filter).exec();
  }
}
