import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, category, account, movement, PASSWORD } from './helpers.js';

describe('HU-FIN-13 Control de acceso basado en roles (RBAC)', () => {
  async function setup() {
    const ctx = makeApp();
    const admin = await ctx.registerAndLogin('Administrador', 'admin@finanzas.pe', 'ADMIN');
    const luis = await ctx.registerAndLogin('Luis Rojas', 'luis.rojas@gmail.com');
    return { ...ctx, admin, luis };
  }

  test('E1 Camino feliz: asigna ADMINISTRADOR y registra fecha y autor del cambio', async () => {
    const { api, admin, luis } = await setup();
    const res = await api.patch(`/api/admin/users/${luis.user.id}/role`).set(admin.auth).send({ role: 'ADMIN' }).expect(200);
    assert.equal(res.body.role, 'ADMIN');
    assert.equal(res.body.roleChangedBy, admin.user.id);
    assert.ok(res.body.roleChangedAt);
  });

  test('E2 Flujo alternativo: cuenta desactivada no inicia sesión y conserva sus datos', async () => {
    const { api, admin, luis, repos } = await setup();
    const food = await category(api, luis.auth, 'expense', 'Alimentación');
    const cash = await account(api, luis.auth, 'Efectivo', 'cash', 100);
    await movement(api, luis.auth, { type: 'expense', amount: 10, date: '2026-11-01', categoryId: food.id, accountId: cash.id });
    await api.patch(`/api/admin/users/${luis.user.id}/status`).set(admin.auth).send({ active: false }).expect(200);
    await api.post('/api/auth/login').send({ email: 'luis.rojas@gmail.com', password: PASSWORD }).expect(403);
    await api.get('/api/transactions').set(luis.auth).expect(401); // el token anterior deja de servir
    assert.equal(await repos.transactions.count(luis.user.id), 1);
    const users = (await api.get('/api/admin/users').set(admin.auth)).body;
    assert.ok(users.every((u) => !('balance' in u) && !('transactions' in u)), 'el administrador no ve datos financieros');
  });

  test('E3 Manejo de errores: un USUARIO recibe 403 en rutas de administración', async () => {
    const { api, luis, admin } = await setup();
    const r1 = await api.get('/api/admin/users').set(luis.auth).expect(403);
    await api.patch(`/api/admin/users/${admin.user.id}/role`).set(luis.auth).send({ role: 'USER' }).expect(403);
    assert.equal(r1.body.message, 'No tienes permisos para realizar esta acción');
  });

  test('E4 Caso de borde: no se puede retirar al último administrador', async () => {
    const { api, admin } = await setup();
    const res = await api.patch(`/api/admin/users/${admin.user.id}/role`).set(admin.auth).send({ role: 'USER' }).expect(409);
    assert.equal(res.body.message, 'Debe existir al menos un administrador activo en la plataforma');
  });
});

describe('HU-FIN-14 Aislamiento de datos por usuario (SaaS multiinquilino)', () => {
  async function setup() {
    const ctx = makeApp();
    const ana = await ctx.registerAndLogin('Ana', 'ana.torres@gmail.com');
    const luis = await ctx.registerAndLogin('Luis', 'luis.rojas@gmail.com');
    const mk = async (s, amount) => {
      const c = await category(ctx.api, s.auth, 'expense', 'Alimentación');
      const a = await account(ctx.api, s.auth, 'Efectivo', 'cash', 1000);
      return (await movement(ctx.api, s.auth, { type: 'expense', amount, date: '2026-11-01', categoryId: c.id, accountId: a.id })).body.transaction;
    };
    return { ...ctx, ana, luis, anaTx: await mk(ana, 11), luisTx: await mk(luis, 22) };
  }

  test('E1 Camino feliz: Ana solo ve sus propios movimientos', async () => {
    const { api, ana } = await setup();
    const res = (await api.get('/api/transactions').set(ana.auth)).body;
    assert.equal(res.total, 1);
    assert.equal(res.items[0].amount, 11);
  });

  test('E2 Flujo alternativo: el propietario se toma del token', async () => {
    const { api, ana, repos } = await setup();
    const cat = (await api.post('/api/categories').set(ana.auth).send({ name: 'Mascotas', type: 'expense' })).body;
    const stored = await repos.categories.findById(ana.user.id, cat.id);
    assert.equal(stored.userId, ana.user.id);
  });

  test('E3 Manejo de errores: acceder al movimiento de Luis responde 404 y no lo modifica', async () => {
    const { api, ana, luis, luisTx } = await setup();
    await api.get(`/api/transactions/${luisTx.id}`).set(ana.auth).expect(404);
    await api.put(`/api/transactions/${luisTx.id}`).set(ana.auth).send({ type: 'expense', amount: 1, date: '2026-11-01', categoryId: luisTx.categoryId, accountId: luisTx.accountId }).expect(404);
    const del = await api.delete(`/api/transactions/${luisTx.id}`).set(ana.auth).expect(404);
    assert.equal(del.body.message, 'Recurso no encontrado');
    assert.equal((await api.get(`/api/transactions/${luisTx.id}`).set(luis.auth).expect(200)).body.amount, 22);
  });

  test('E4 Caso de borde: un userId manipulado en el cuerpo se ignora', async () => {
    const { api, ana, luis, anaTx, repos } = await setup();
    const res = await movement(api, ana.auth, { type: 'expense', amount: 5, date: '2026-11-02', categoryId: anaTx.categoryId, accountId: anaTx.accountId, userId: luis.user.id });
    const sent = await api.post('/api/transactions').set(ana.auth)
      .send({ type: 'expense', amount: 7, date: '2026-11-02', categoryId: anaTx.categoryId, accountId: anaTx.accountId, userId: luis.user.id });
    assert.equal(sent.status, 201);
    assert.equal((await repos.transactions.findById(ana.user.id, sent.body.transaction.id)).userId, ana.user.id);
    assert.equal(await repos.transactions.count(luis.user.id), 1, 'Luis no recibió movimientos ajenos');
    assert.equal(res.status, 201);
  });

  test('Ana no puede usar la categoría o cuenta de Luis en sus movimientos', async () => {
    const { ana, luisTx, api } = await setup();
    const res = await movement(api, ana.auth, { type: 'expense', amount: 5, date: '2026-11-02', categoryId: luisTx.categoryId, accountId: luisTx.accountId });
    assert.equal(res.status, 400);
  });
});
