/**
 * Demostración EN VIVO de seguridad (rúbrica: JWT, RBAC y aislamiento multiinquilino).
 * Requiere la API corriendo y los datos de `npm run seed` (o `npm run demo`).
 *
 *   npm run demo:seguridad                     (usa http://localhost:3000/api)
 *   API_URL=http://otra-url/api npm run demo:seguridad
 */
const API = process.env.API_URL || 'http://localhost:3000/api';
let ok = 0;
let fail = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

function check(title, condition, detail = '') {
  if (condition) ok += 1; else fail += 1;
  console.log(`${condition ? '  ✔' : '  ✖'} ${title}${detail ? `  →  ${detail}` : ''}`);
}

async function login(email, password) {
  const r = await call('POST', '/auth/login', { body: { email, password } });
  if (r.status !== 200) throw new Error(`No se pudo iniciar sesión con ${email} (${r.status}): ${r.body?.message}`);
  return r.body.token;
}

async function main() {
  console.log(`\nDemostración de seguridad contra ${API}\n`);
  const ana = await login('ana.torres@gmail.com', 'Finanzas#2026');
  const luis = await login('luis.rojas@gmail.com', 'Finanzas#2026');
  const admin = await login('admin@finanzas.pe', 'Admin#2026');

  console.log('1) Autenticación JWT');
  const payload = JSON.parse(Buffer.from(ana.split('.')[1], 'base64url').toString());
  check('El token es un JWT firmado que expira en 1 hora', payload.exp - payload.iat === 3600, `rol=${payload.role}`);
  check('Sin token la API responde 401', (await call('GET', '/transactions')).status === 401);
  check('Con un token alterado responde 401', (await call('GET', '/transactions', { token: `${ana.slice(0, -3)}abc` })).status === 401);

  console.log('\n2) Aislamiento de datos por usuario (filtro userId en el repositorio)');
  const anaList = (await call('GET', '/transactions?pageSize=10000', { token: ana })).body;
  const luisList = (await call('GET', '/transactions?pageSize=10000', { token: luis })).body;
  check('Ana solo ve sus movimientos', anaList.items.every((t) => t.userId === anaList.items[0].userId), `${anaList.total} movimientos`);
  check('Luis solo ve los suyos', luisList.items.every((t) => t.userId === luisList.items[0].userId), `${luisList.total} movimientos`);
  check('Ningún movimiento se comparte entre ambos', !anaList.items.some((a) => luisList.items.some((l) => l.id === a.id)));

  const luisTx = luisList.items[0];
  const peek = await call('GET', `/transactions/${luisTx.id}`, { token: ana });
  check('Ana pide un movimiento de Luis por su ID → 404', peek.status === 404, peek.body?.message);
  const edit = await call('PUT', `/transactions/${luisTx.id}`, {
    token: ana,
    body: { type: luisTx.type, amount: 1, date: '2026-11-01', categoryId: luisTx.categoryId, accountId: luisTx.accountId },
  });
  check('Ana intenta editarlo → 404', edit.status === 404);
  check('Ana intenta eliminarlo → 404', (await call('DELETE', `/transactions/${luisTx.id}`, { token: ana })).status === 404);
  const still = await call('GET', `/transactions/${luisTx.id}`, { token: luis });
  check('El movimiento de Luis sigue intacto', still.status === 200 && still.body.amount === luisTx.amount, `S/ ${still.body?.amount}`);

  const anaExpense = anaList.items.find((t) => t.type === 'expense');
  const forged = await call('POST', '/transactions', {
    token: ana,
    body: { type: 'expense', amount: 1, date: '2026-11-01', categoryId: anaExpense.categoryId, accountId: anaExpense.accountId, userId: luisTx.userId },
  });
  const luisAfter = (await call('GET', '/transactions', { token: luis })).body.total;
  check(
    'Un userId falso en el cuerpo se ignora: el registro queda a nombre de Ana',
    forged.status === 201 && forged.body.transaction.userId === anaExpense.userId && luisAfter === luisList.total,
  );
  if (forged.status === 201) await call('DELETE', `/transactions/${forged.body.transaction.id}`, { token: ana });

  console.log('\n3) Control de acceso basado en roles (RBAC)');
  const denied = await call('GET', '/admin/users', { token: ana });
  check('Un USUARIO entra a /admin/users → 403', denied.status === 403, denied.body?.message);
  const users = await call('GET', '/admin/users', { token: admin });
  check('Un ADMINISTRADOR lista los usuarios → 200', users.status === 200, `${users.body?.length} usuarios`);
  check('El administrador no ve datos financieros de los usuarios', users.body.every((u) => !('balance' in u) && !('passwordHash' in u)));
  const self = users.body.find((u) => u.email === 'admin@finanzas.pe');
  const last = await call('PATCH', `/admin/users/${self.id}/role`, { token: admin, body: { role: 'USER' } });
  check('No se puede retirar al último administrador → 409', last.status === 409, last.body?.message);

  console.log(`\nResultado: ${ok} verificaciones correctas, ${fail} fallidas.\n`);
  process.exitCode = fail ? 1 : 0;
}

main().catch((err) => {
  console.error(`\nNo se pudo ejecutar la demostración: ${err.message}\n¿La API está corriendo y se ejecutó "npm run seed"?\n`);
  process.exitCode = 1;
});
