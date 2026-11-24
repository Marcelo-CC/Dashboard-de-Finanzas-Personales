import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MongoTenantRepository } from '../src/repositories/mongo/MongoTenantRepository.js';
import { TransactionModel, CategoryModel, UserModel } from '../src/models/index.js';

describe('Repositorio MongoDB: aislamiento y esquemas (sin conexión)', () => {
  test('scope() siempre fuerza el userId del token, aunque el filtro traiga otro', () => {
    const repo = new MongoTenantRepository(TransactionModel);
    assert.deepEqual(repo.scope('ana', { userId: 'luis', type: 'expense' }), { type: 'expense', userId: 'ana' });
    assert.throws(() => repo.scope(undefined, {}), /userId es obligatorio/);
  });

  test('El esquema Transaction rechaza montos menores a 0.01 y tipos inválidos', async () => {
    const t = new TransactionModel({ userId: 'u', type: 'otro', amount: 0, date: new Date(), categoryId: 'c', accountId: 'a' });
    const err = await t.validate().catch((e) => e);
    assert.ok(err.errors.amount);
    assert.ok(err.errors.type);
  });

  test('Los _id son UUID v4 y el JSON expone "id" sin datos sensibles', () => {
    const u = new UserModel({ name: 'Ana', email: 'ANA@GMAIL.COM', passwordHash: 'x' });
    assert.match(u._id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const json = u.toJSON();
    assert.equal(json.email, 'ana@gmail.com');
    assert.equal(json.passwordHash, undefined);
    assert.equal(json.id, u._id);
  });

  test('Índice único de categorías por usuario + tipo + nombre normalizado', () => {
    const idx = CategoryModel.schema.indexes().find(([fields]) => fields.nameKey);
    assert.deepEqual(idx[0], { userId: 1, type: 1, nameKey: 1 });
    assert.equal(idx[1].unique, true);
  });
});
