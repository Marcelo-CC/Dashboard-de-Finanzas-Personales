import { ROLES } from '../domain/constants.js';
import { lastMonths, currentMonth, today as todayInTz } from '../utils/dates.js';

export const DEMO_USERS = [
  { name: 'Administrador', email: 'admin@finanzas.pe', password: 'Admin#2026', role: ROLES.ADMIN },
  { name: 'Ana Torres', email: 'ana.torres@gmail.com', password: 'Finanzas#2026', role: ROLES.USER },
  { name: 'Luis Rojas', email: 'luis.rojas@gmail.com', password: 'Finanzas#2026', role: ROLES.USER },
];

// Generador determinista para que la demo siempre muestre los mismos datos
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const EXPENSE_PLAN = [
  { category: 'Alimentación', min: 15, max: 65, perMonth: 9, account: ['Efectivo', 'BCP Ahorros'], desc: ['Almuerzo', 'Mercado', 'Cena', 'Supermercado'] },
  { category: 'Transporte', min: 3, max: 25, perMonth: 7, account: ['Yape', 'Efectivo', 'Visa BBVA'], desc: ['Pasaje', 'Taxi', 'Combustible'] },
  { category: 'Vivienda', min: 650, max: 650, perMonth: 1, account: 'BCP Ahorros', desc: ['Alquiler'] },
  { category: 'Servicios', min: 60, max: 140, perMonth: 2, account: 'BCP Ahorros', desc: ['Luz', 'Agua', 'Internet'] },
  { category: 'Ocio', min: 20, max: 90, perMonth: 2, account: 'Visa BBVA', desc: ['Cine', 'Salida con amigos', 'Streaming'] },
];

/**
 * Crea los usuarios demo con categorías, cuentas, 6 meses de movimientos y presupuesto del mes actual.
 * Se usa en el modo demo (DATA_DRIVER=memory) y en el script `npm run seed` para MongoDB.
 */
export async function seedDemoData({ repos, services }) {
  const created = [];
  for (const u of DEMO_USERS) {
    let user = await repos.users.findByEmail(u.email);
    if (!user) {
      const pub = await services.auth.register({ name: u.name, email: u.email, password: u.password, confirmPassword: u.password });
      user = await repos.users.update(pub.id, { role: u.role });
    }
    created.push({ ...u, id: user.id });
  }

  await seedLuis({ repos, services, luis: created.find((u) => u.email === 'luis.rojas@gmail.com') });

  const ana = created.find((u) => u.email === 'ana.torres@gmail.com');
  const actor = { id: ana.id, role: ROLES.USER };
  if ((await repos.transactions.count(ana.id)) > 0) return created;

  await services.categories.create(actor, { name: 'Servicios', type: 'expense' });
  await services.categories.create(actor, { name: 'Freelance', type: 'income' });
  const cats = new Map((await repos.categories.findAll(ana.id)).map((c) => [c.name, c.id]));

  const accounts = {};
  for (const a of [
    { name: 'Efectivo', type: 'cash', initialBalance: 500 },
    { name: 'BCP Ahorros', type: 'bank', initialBalance: 1200 },
    { name: 'Yape', type: 'wallet', initialBalance: 300 },
    { name: 'Visa BBVA', type: 'credit_card', initialBalance: -350 },
  ]) {
    accounts[a.name] = (await services.accounts.create(actor, a)).id;
  }

  const random = rng(2026);
  const month = currentMonth();
  const todayDay = Number(todayInTz().slice(8, 10));
  for (const m of lastMonths(month, 6)) {
    const [y, mo] = m.split('-').map(Number);
    const lastDay = m === month ? todayDay : new Date(Date.UTC(y, mo, 0)).getUTCDate();
    const day = (d) => `${m}-${String(Math.min(d, lastDay)).padStart(2, '0')}`;
    const add = (type, category, account, amount, d, description) =>
      repos.transactions.create(ana.id, {
        type,
        amount: Math.round(amount * 100) / 100,
        date: new Date(`${day(d)}T12:00:00.000Z`),
        categoryId: cats.get(category),
        accountId: accounts[account],
        description,
      });

    await add('income', 'Sueldo', 'BCP Ahorros', 3500, 1, 'Sueldo mensual');
    await add('income', 'Freelance', 'Efectivo', 250 + Math.round(random() * 450), 18, 'Proyecto freelance');
    for (const p of EXPENSE_PLAN) {
      for (let i = 0; i < p.perMonth; i += 1) {
        const amount = p.min + random() * (p.max - p.min);
        const account = Array.isArray(p.account) ? p.account[i % p.account.length] : p.account;
        await add('expense', p.category, account, amount, 1 + Math.floor(random() * Math.min(28, lastDay)), p.desc[i % p.desc.length]);
      }
    }
  }

  await services.budgets.upsert(actor, { month, amount: 2500 });
  return created;
}

/** Luis tiene pocos datos y montos distintos: sirve para demostrar en vivo el aislamiento entre usuarios. */
async function seedLuis({ repos, services, luis }) {
  if ((await repos.transactions.count(luis.id)) > 0) return;
  const actor = { id: luis.id, role: ROLES.USER };
  const cats = new Map((await repos.categories.findAll(luis.id)).map((c) => [c.name, c.id]));
  const account = await services.accounts.create(actor, { name: 'Interbank', type: 'bank', initialBalance: 800 });
  const month = currentMonth();
  const movements = [
    ['income', 'Sueldo', 2200, '02', 'Sueldo Luis'],
    ['expense', 'Alimentación', 111.11, '05', 'Movimiento de Luis'],
    ['expense', 'Transporte', 22.22, '08', 'Movimiento de Luis'],
    ['expense', 'Ocio', 333.33, '12', 'Movimiento de Luis'],
  ];
  for (const [type, category, amount, day, description] of movements) {
    await repos.transactions.create(luis.id, {
      type, amount, date: new Date(`${month}-${day}T12:00:00.000Z`), categoryId: cats.get(category), accountId: account.id, description,
    });
  }
  await services.budgets.upsert(actor, { month, amount: 1000 });
}
