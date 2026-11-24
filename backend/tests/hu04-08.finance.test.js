import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, category, account, movement } from './helpers.js';

async function setup() {
  const ctx = makeApp();
  const session = await ctx.registerAndLogin('Ana Torres', 'ana.torres@gmail.com');
  return { ...ctx, ...session };
}

describe('HU-FIN-04 Registro de ingresos y gastos', () => {
  test('E1 Camino feliz: gasto de S/ 45.50 deja "Efectivo" en S/ 454.50', async () => {
    const { api, auth } = await setup();
    const food = await category(api, auth, 'expense', 'Alimentación');
    const cash = await account(api, auth, 'Efectivo', 'cash', 500);
    const res = await movement(api, auth, { type: 'expense', amount: 45.5, date: '2026-11-20', categoryId: food.id, accountId: cash.id, description: 'Almuerzo' });
    assert.equal(res.status, 201);
    assert.equal(res.body.accountBalance, 454.5);
    assert.equal(res.body.transaction.categoryName, 'Alimentación');
  });

  test('E2 Flujo alternativo: ingreso de S/ 3,000 deja "BCP Ahorros" en S/ 4,200 y suma al mes', async () => {
    const { api, auth } = await setup();
    const salary = await category(api, auth, 'income', 'Sueldo');
    const bcp = await account(api, auth, 'BCP Ahorros', 'bank', 1200);
    const res = await movement(api, auth, { type: 'income', amount: 3000, date: '2026-11-15', categoryId: salary.id, accountId: bcp.id });
    assert.equal(res.body.accountBalance, 4200);
    const summary = (await api.get('/api/dashboard/summary?month=2026-11').set(auth)).body;
    assert.equal(summary.income, 3000);
  });

  test('E3 Manejo de errores: montos "0", "-20" y "abc" son rechazados', async () => {
    const { api, auth } = await setup();
    const food = await category(api, auth, 'expense', 'Alimentación');
    const cash = await account(api, auth, 'Efectivo', 'cash', 500);
    for (const amount of ['0', '-20', 'abc', '10.555']) {
      const res = await movement(api, auth, { type: 'expense', amount, date: '2026-11-20', categoryId: food.id, accountId: cash.id });
      assert.equal(res.status, 400, `monto ${amount}`);
      assert.equal(res.body.details.amount, 'El monto debe ser un número mayor a 0');
    }
    assert.equal((await api.get('/api/transactions').set(auth)).body.total, 0);
  });

  test('E4 Caso de borde: un gasto mayor al saldo se registra (previa confirmación en la interfaz) y el saldo queda negativo', async () => {
    const { api, auth } = await setup();
    const food = await category(api, auth, 'expense', 'Alimentación');
    const cash = await account(api, auth, 'Efectivo', 'cash', 30);
    const res = await movement(api, auth, { type: 'expense', amount: 45.5, date: '2026-11-20', categoryId: food.id, accountId: cash.id });
    assert.equal(res.status, 201);
    assert.equal(res.body.accountBalance, -15.5);
  });

  test('La categoría debe corresponder al tipo de movimiento', async () => {
    const { api, auth } = await setup();
    const salary = await category(api, auth, 'income', 'Sueldo');
    const cash = await account(api, auth, 'Efectivo');
    const res = await movement(api, auth, { type: 'expense', amount: 10, date: '2026-11-20', categoryId: salary.id, accountId: cash.id });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'La categoría no corresponde al tipo de movimiento');
  });
});

describe('HU-FIN-05 Administración de categorías', () => {
  test('E1 Camino feliz: crea la categoría de gasto "Mascotas"', async () => {
    const { api, auth } = await setup();
    const res = await api.post('/api/categories').set(auth).send({ name: 'Mascotas', type: 'expense' }).expect(201);
    assert.equal(res.body.name, 'Mascotas');
    const names = (await api.get('/api/categories?type=expense').set(auth)).body.map((c) => c.name);
    assert.ok(names.includes('Mascotas'));
  });

  test('E2 Flujo alternativo: renombrar "Ocio" a "Entretenimiento" actualiza sus 8 movimientos', async () => {
    const { api, auth } = await setup();
    const ocio = await category(api, auth, 'expense', 'Ocio');
    const cash = await account(api, auth, 'Efectivo', 'cash', 1000);
    for (let i = 0; i < 8; i += 1) await movement(api, auth, { type: 'expense', amount: 10, date: '2026-11-10', categoryId: ocio.id, accountId: cash.id });
    await api.patch(`/api/categories/${ocio.id}`).set(auth).send({ name: 'Entretenimiento' }).expect(200);
    const list = (await api.get(`/api/transactions?categoryId=${ocio.id}`).set(auth)).body;
    assert.equal(list.total, 8);
    assert.ok(list.items.every((t) => t.categoryName === 'Entretenimiento'));
  });

  test('E3 Manejo de errores: "transporte" duplica a "Transporte" sin distinguir mayúsculas', async () => {
    const { api, auth } = await setup();
    const res = await api.post('/api/categories').set(auth).send({ name: 'transporte', type: 'expense' }).expect(409);
    assert.equal(res.body.message, 'Ya existe una categoría con ese nombre');
  });

  test('E4 Caso de borde: "Vivienda" con 5 movimientos exige reemplazo antes de eliminarse', async () => {
    const { api, auth } = await setup();
    const vivienda = await category(api, auth, 'expense', 'Vivienda');
    const otros = await category(api, auth, 'expense', 'Otros gastos');
    const cash = await account(api, auth, 'Efectivo', 'cash', 5000);
    for (let i = 0; i < 5; i += 1) await movement(api, auth, { type: 'expense', amount: 100, date: '2026-11-05', categoryId: vivienda.id, accountId: cash.id });
    const blocked = await api.delete(`/api/categories/${vivienda.id}`).set(auth).expect(409);
    assert.equal(blocked.body.message, 'Esta categoría tiene 5 movimientos. Selecciona una categoría de reemplazo antes de eliminarla');
    await api.delete(`/api/categories/${vivienda.id}?replacementId=${otros.id}`).set(auth).expect(200);
    assert.equal((await api.get(`/api/transactions?categoryId=${otros.id}`).set(auth)).body.total, 5);
  });
});

describe('HU-FIN-06 Registro de cuentas y medios de pago', () => {
  test('E1 Camino feliz: billetera digital "Yape" con S/ 150.00', async () => {
    const { api, auth } = await setup();
    const yape = await account(api, auth, 'Yape', 'wallet', 150);
    assert.equal(yape.balance, 150);
  });

  test('E2 Flujo alternativo: saldo consolidado S/ 200 + S/ 1,800 = S/ 2,000', async () => {
    const { api, auth } = await setup();
    await account(api, auth, 'Efectivo', 'cash', 200);
    await account(api, auth, 'BCP Ahorros', 'bank', 1800);
    const res = await api.get('/api/accounts').set(auth).expect(200);
    assert.equal(res.body.totalBalance, 2000);
  });

  test('E3 Manejo de errores: nombre y tipo obligatorios', async () => {
    const { api, auth } = await setup();
    const res = await api.post('/api/accounts').set(auth).send({ name: '', initialBalance: 10 }).expect(400);
    assert.equal(res.body.details.name, 'Este campo es obligatorio');
    assert.equal(res.body.details.type, 'Este campo es obligatorio');
  });

  test('E4 Caso de borde: saldo negativo solo para tarjeta de crédito', async () => {
    const { api, auth } = await setup();
    const visa = await account(api, auth, 'Visa BBVA', 'credit_card', -350);
    assert.equal(visa.balance, -350);
    const res = await api.post('/api/accounts').set(auth).send({ name: 'Caja', type: 'cash', initialBalance: -350 }).expect(400);
    assert.equal(res.body.message, 'Solo las tarjetas de crédito pueden registrar un saldo inicial negativo');
  });
});

describe('HU-FIN-07 Consulta del historial de movimientos', () => {
  test('E1 Camino feliz: 35 movimientos → 10 más recientes y "Página 1 de 4"', async () => {
    const { api, auth } = await setup();
    const food = await category(api, auth, 'expense', 'Alimentación');
    const cash = await account(api, auth, 'Efectivo', 'cash', 5000);
    for (let d = 1; d <= 35; d += 1) {
      const date = `2026-${d <= 28 ? '10' : '11'}-${String(d <= 28 ? d : d - 28).padStart(2, '0')}`;
      await movement(api, auth, { type: 'expense', amount: 1, date, categoryId: food.id, accountId: cash.id });
    }
    const res = (await api.get('/api/transactions?page=1').set(auth).expect(200)).body;
    assert.equal(res.items.length, 10);
    assert.equal(res.totalPages, 4);
    assert.equal(new Date(res.items[0].date).toISOString().slice(0, 10), '2026-11-07');
    const dates = res.items.map((t) => new Date(t.date).getTime());
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a), 'orden del más reciente al más antiguo');
  });

  test('E2 Flujo alternativo: corregir S/ 45.50 → S/ 54.50 descuenta S/ 9.00 adicionales', async () => {
    const { api, auth } = await setup();
    const food = await category(api, auth, 'expense', 'Alimentación');
    const cash = await account(api, auth, 'Efectivo', 'cash', 500);
    const created = (await movement(api, auth, { type: 'expense', amount: 45.5, date: '2026-11-20', categoryId: food.id, accountId: cash.id })).body;
    assert.equal(created.accountBalance, 454.5);
    const res = await api.put(`/api/transactions/${created.transaction.id}`).set(auth)
      .send({ type: 'expense', amount: 54.5, date: '2026-11-20', categoryId: food.id, accountId: cash.id }).expect(200);
    assert.equal(res.body.accountBalance, 445.5);
  });

  test('E4 Caso de borde: usuario sin movimientos', async () => {
    const { api, auth } = await setup();
    const res = (await api.get('/api/transactions').set(auth).expect(200)).body;
    assert.equal(res.total, 0);
    assert.deepEqual(res.items, []);
  });
});

describe('HU-FIN-08 Filtrado de movimientos', () => {
  async function seeded() {
    const ctx = await setup();
    const { api, auth } = ctx;
    const food = await category(api, auth, 'expense', 'Alimentación');
    const transport = await category(api, auth, 'expense', 'Transporte');
    const salary = await category(api, auth, 'income', 'Sueldo');
    const cash = await account(api, auth, 'Efectivo', 'cash', 9000);
    const add = (type, c, amount, date) => movement(api, auth, { type, amount, date, categoryId: c.id, accountId: cash.id });
    await add('expense', food, 30, '2026-09-15');
    await add('expense', food, 40, '2026-11-02');
    await add('expense', food, 25.5, '2026-11-28');
    await add('expense', transport, 12, '2026-11-10');
    await add('income', salary, 3500, '2026-11-01');
    return { ...ctx, food };
  }

  test('E1 Camino feliz: noviembre + "Alimentación" + "Gasto" con total filtrado', async () => {
    const { api, auth, food } = await seeded();
    const res = (await api.get(`/api/transactions?from=2026-11-01&to=2026-11-30&categoryId=${food.id}&type=expense`).set(auth).expect(200)).body;
    assert.equal(res.total, 2);
    assert.equal(res.totals.expense, 65.5);
  });

  test('E2 Flujo alternativo: sin filtros vuelve el historial completo', async () => {
    const { api, auth } = await seeded();
    assert.equal((await api.get('/api/transactions').set(auth)).body.total, 5);
  });

  test('E3 Manejo de errores: rango de fechas invertido', async () => {
    const { api, auth } = await seeded();
    const res = await api.get('/api/transactions?from=2026-11-30&to=2026-11-01').set(auth).expect(400);
    assert.equal(res.body.message, 'La fecha inicial no puede ser posterior a la fecha final');
  });

  test('E4 Caso de borde: filtro sin resultados con total S/ 0.00', async () => {
    const { api, auth } = await seeded();
    const pets = await category(api, auth, 'expense', 'Mascotas');
    const res = (await api.get(`/api/transactions?from=2026-10-01&to=2026-10-31&categoryId=${pets.id}`).set(auth)).body;
    assert.equal(res.total, 0);
    assert.equal(res.totals.expense, 0);
  });
});
