import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, category, account, movement } from './helpers.js';

async function setup() {
  const ctx = makeApp();
  const s = await ctx.registerAndLogin('Ana Torres', 'ana.torres@gmail.com');
  const { api } = ctx;
  const refs = {
    salary: await category(api, s.auth, 'income', 'Sueldo'),
    food: await category(api, s.auth, 'expense', 'Alimentación'),
    home: await category(api, s.auth, 'expense', 'Vivienda'),
    cash: await account(api, s.auth, 'Efectivo', 'cash', 10000),
  };
  const add = (type, cat, amount, date) => movement(api, s.auth, { type, amount, date, categoryId: refs[cat].id, accountId: refs.cash.id });
  return { ...ctx, ...s, refs, add };
}

describe('HU-FIN-09 Dashboard de indicadores financieros', () => {
  test('E1 Camino feliz: ingresos S/ 3,500, gastos S/ 2,100, balance S/ 1,400', async () => {
    const { api, auth, add } = await setup();
    await add('income', 'salary', 3500, '2026-11-01');
    await add('expense', 'food', 840, '2026-11-05');
    await add('expense', 'home', 1260, '2026-11-06');
    const s = (await api.get('/api/dashboard/summary?month=2026-11').set(auth).expect(200)).body;
    assert.deepEqual([s.income, s.expense, s.balance], [3500, 2100, 1400]);
  });

  test('E2 Flujo alternativo: el periodo "Octubre 2026" solo considera octubre', async () => {
    const { api, auth, add } = await setup();
    await add('income', 'salary', 3500, '2026-11-01');
    await add('income', 'salary', 2000, '2026-10-01');
    await add('expense', 'food', 100, '2026-10-31');
    const s = (await api.get('/api/dashboard/summary?month=2026-10').set(auth)).body;
    assert.deepEqual([s.income, s.expense, s.balance], [2000, 100, 1900]);
  });

  test('E3 Manejo de errores: sin sesión válida responde 401', async () => {
    const { api } = await setup();
    const res = await api.get('/api/dashboard/summary').expect(401);
    assert.equal(res.body.message, 'No autorizado');
  });

  test('E4 Caso de borde: balance negativo S/ -250.00 con aviso', async () => {
    const { api, auth, add } = await setup();
    await add('income', 'salary', 1000, '2026-11-01');
    await add('expense', 'home', 1250, '2026-11-02');
    const s = (await api.get('/api/dashboard/summary?month=2026-11').set(auth)).body;
    assert.equal(s.balance, -250);
    assert.equal(s.message, 'Tus gastos superan tus ingresos este mes');
  });
});

describe('HU-FIN-10 Gráficos', () => {
  test('E1 Camino feliz: series de 6 meses (barras, líneas y circular)', async () => {
    const { api, auth, add } = await setup();
    await add('income', 'salary', 3000, '2026-06-01');
    await add('income', 'salary', 3500, '2026-11-01');
    await add('expense', 'food', 500, '2026-11-03');
    const c = (await api.get('/api/dashboard/charts?month=2026-11&months=6').set(auth).expect(200)).body;
    assert.deepEqual(c.monthly.labels, ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    assert.deepEqual(c.monthly.income, [3000, 0, 0, 0, 0, 3500]);
    assert.deepEqual(c.monthly.cumulativeBalance, [3000, 3000, 3000, 3000, 3000, 6000]);
  });

  test('E2 Flujo alternativo: "Alimentación" = S/ 840.00 y 40 % de S/ 2,100.00', async () => {
    const { api, auth, add } = await setup();
    await add('expense', 'food', 840, '2026-11-05');
    await add('expense', 'home', 1260, '2026-11-06');
    const { distribution } = (await api.get('/api/dashboard/charts?month=2026-11').set(auth)).body;
    assert.equal(distribution.total, 2100);
    const food = distribution.items.find((i) => i.category === 'Alimentación');
    assert.deepEqual([food.total, food.percent], [840, 40]);
  });

  test('E3 Manejo de errores: periodo inválido', async () => {
    const { api, auth } = await setup();
    const res = await api.get('/api/dashboard/charts?month=2026-13').set(auth).expect(400);
    assert.equal(res.body.message, 'El periodo debe tener el formato AAAA-MM');
  });

  test('E4 Caso de borde: una sola categoría = 100 % sin porciones vacías', async () => {
    const { api, auth, add } = await setup();
    await add('expense', 'home', 650, '2026-11-02');
    const { distribution } = (await api.get('/api/dashboard/charts?month=2026-11').set(auth)).body;
    assert.equal(distribution.items.length, 1);
    assert.deepEqual([distribution.items[0].category, distribution.items[0].percent], ['Vivienda', 100]);
  });
});

describe('HU-FIN-11 Presupuesto mensual y seguimiento', () => {
  test('E1 Camino feliz: presupuesto de S/ 2,500 para diciembre al 0 %', async () => {
    const { api, auth } = await setup();
    const s = (await api.put('/api/budgets').set(auth).send({ month: '2026-12', amount: 2500 }).expect(200)).body;
    assert.deepEqual([s.amount, s.spent, s.percent, s.level], [2500, 0, 0, 'ok']);
  });

  test('E2 Flujo alternativo: S/ 1,950 + S/ 60 = 80.4 % y alerta preventiva', async () => {
    const { api, auth, add } = await setup();
    await api.put('/api/budgets').set(auth).send({ month: '2026-11', amount: 2500 });
    await add('expense', 'home', 1950, '2026-11-02');
    const res = (await add('expense', 'food', 60, '2026-11-10')).body;
    assert.equal(res.budgetAlert.percent, 80.4);
    assert.equal(res.budgetAlert.level, 'warning');
    assert.equal(res.budgetAlert.message, 'Has consumido el 80 % de tu presupuesto mensual');
  });

  test('E3 Manejo de errores: presupuesto de S/ 0.00 o no numérico', async () => {
    const { api, auth } = await setup();
    for (const amount of [0, 'abc']) {
      const res = await api.put('/api/budgets').set(auth).send({ month: '2026-11', amount }).expect(400);
      assert.equal(res.body.message, 'El presupuesto debe ser un monto mayor a 0');
    }
  });

  test('E4 Caso de borde: S/ 2,480 + S/ 50 = 101.2 % y exceso de S/ 30.00', async () => {
    const { api, auth, add } = await setup();
    await api.put('/api/budgets').set(auth).send({ month: '2026-11', amount: 2500 });
    await add('expense', 'home', 2480, '2026-11-02');
    const res = (await add('expense', 'food', 50, '2026-11-10')).body;
    assert.equal(res.budgetAlert.percent, 101.2);
    assert.equal(res.budgetAlert.level, 'exceeded');
    assert.equal(res.budgetAlert.message, 'Has superado tu presupuesto mensual en S/ 30.00');
  });
});

describe('HU-FIN-12 Exportación de reportes (datos para PDF/Excel)', () => {
  test('E2 Flujo alternativo: la exportación recibe solo los movimientos filtrados', async () => {
    const { api, auth, add } = await setup();
    await add('expense', 'food', 10, '2026-11-02');
    await add('expense', 'home', 20, '2026-11-03');
    const res = (await api.get('/api/transactions?type=expense&categoryId=' + (await api.get('/api/categories?type=expense').set(auth)).body.find((c) => c.name === 'Alimentación').id + '&pageSize=10000').set(auth)).body;
    assert.equal(res.total, 1);
  });

  test('E4 Caso de borde: 1,500 movimientos del año en un solo archivo, totales iguales al dashboard', async () => {
    const { api, auth, repos, user, refs } = await setup();
    for (let i = 0; i < 1500; i += 1) {
      const month = String((i % 12) + 1).padStart(2, '0');
      await repos.transactions.create(user.id, {
        type: 'expense', amount: 2, date: new Date(`2026-${month}-10T12:00:00Z`), categoryId: refs.food.id, accountId: refs.cash.id,
      });
    }
    const res = (await api.get('/api/transactions?from=2026-01-01&to=2026-12-31&pageSize=10000').set(auth)).body;
    assert.equal(res.items.length, 1500);
    assert.equal(res.totals.expense, 3000);
  });
});
