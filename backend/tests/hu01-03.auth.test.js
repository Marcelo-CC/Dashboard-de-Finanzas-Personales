import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, PASSWORD } from './helpers.js';

describe('HU-FIN-01 Registro de cuenta de usuario', () => {
  test('E1 Camino feliz: registro exitoso con datos válidos', async () => {
    const { api, repos } = makeApp();
    const res = await api.post('/api/auth/register')
      .send({ name: 'Ana Torres', email: 'ana.torres@gmail.com', password: 'Finanzas#2026', confirmPassword: 'Finanzas#2026' })
      .expect(201);
    assert.equal(res.body.role, 'USER');
    assert.match(res.body.id, /^[0-9a-f-]{36}$/);
    const stored = await repos.users.findByEmail('ana.torres@gmail.com');
    assert.notEqual(stored.passwordHash, 'Finanzas#2026', 'la contraseña se almacena cifrada');
    assert.equal(res.body.passwordHash, undefined, 'el hash nunca se expone');
  });

  test('E2 Flujo alternativo: primer ingreso con categorías predeterminadas', async () => {
    const { api, registerAndLogin } = makeApp();
    const { auth } = await registerAndLogin('Ana Torres', 'ana.torres@gmail.com');
    const cats = (await api.get('/api/categories').set(auth).expect(200)).body.map((c) => c.name).sort();
    assert.deepEqual(cats, ['Alimentación', 'Ocio', 'Sueldo', 'Transporte', 'Vivienda'].sort());
    const summary = (await api.get('/api/dashboard/summary?month=2026-11').set(auth).expect(200)).body;
    assert.deepEqual([summary.income, summary.expense, summary.balance], [0, 0, 0]);
  });

  test('E3 Manejo de errores: correo electrónico ya registrado', async () => {
    const { api } = makeApp();
    const body = { name: 'Ana Torres', email: 'ana.torres@gmail.com', password: PASSWORD, confirmPassword: PASSWORD };
    await api.post('/api/auth/register').send(body).expect(201);
    const res = await api.post('/api/auth/register').send(body).expect(409);
    assert.equal(res.body.message, 'El correo electrónico ya se encuentra registrado');
  });

  test('E4 Caso de borde: contraseña por debajo del mínimo de seguridad', async () => {
    const { api } = makeApp();
    const res = await api.post('/api/auth/register')
      .send({ name: 'Ana', email: 'ana@gmail.com', password: 'Fin#202', confirmPassword: 'Fin#202' })
      .expect(400);
    assert.equal(res.body.details.password, 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo');
  });
});

describe('HU-FIN-02 Inicio de sesión seguro', () => {
  test('E1 Camino feliz: credenciales válidas generan un JWT de 1 hora', async () => {
    const { api } = makeApp();
    await api.post('/api/auth/register').send({ name: 'Ana', email: 'ana.torres@gmail.com', password: PASSWORD, confirmPassword: PASSWORD });
    const res = await api.post('/api/auth/login').send({ email: 'ana.torres@gmail.com', password: PASSWORD }).expect(200);
    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64url').toString());
    assert.equal(payload.exp - payload.iat, 3600);
    assert.equal(res.body.user.name, 'Ana');
  });

  test('E2 Flujo alternativo: la sesión vigente se mantiene (GET /auth/me con el token)', async () => {
    const { api, registerAndLogin } = makeApp();
    const { auth } = await registerAndLogin('Ana', 'ana.torres@gmail.com');
    const me = await api.get('/api/auth/me').set(auth).expect(200);
    assert.equal(me.body.email, 'ana.torres@gmail.com');
  });

  test('E3 Manejo de errores: credenciales incorrectas con mensaje genérico', async () => {
    const { api, registerAndLogin } = makeApp();
    await registerAndLogin('Ana', 'ana.torres@gmail.com');
    const wrongPwd = await api.post('/api/auth/login').send({ email: 'ana.torres@gmail.com', password: 'Otra#2026' }).expect(401);
    const wrongMail = await api.post('/api/auth/login').send({ email: 'nadie@gmail.com', password: PASSWORD }).expect(401);
    assert.equal(wrongPwd.body.message, 'Correo o contraseña incorrectos');
    assert.equal(wrongMail.body.message, wrongPwd.body.message, 'no revela cuál dato falló');
  });

  test('E4 Caso de borde: bloqueo de 15 minutos tras el quinto intento fallido', async () => {
    const { api, registerAndLogin, clock } = makeApp();
    await registerAndLogin('Ana', 'ana.torres@gmail.com');
    const bad = { email: 'ana.torres@gmail.com', password: 'Mala#2026' };
    for (let i = 0; i < 4; i += 1) await api.post('/api/auth/login').send(bad).expect(401);
    const fifth = await api.post('/api/auth/login').send(bad).expect(423);
    assert.equal(fifth.body.message, 'Cuenta bloqueada temporalmente. Intenta nuevamente en 15 minutos');
    await api.post('/api/auth/login').send({ email: bad.email, password: PASSWORD }).expect(423);
    clock.now = new Date(clock.now.getTime() + 16 * 60000);
    await api.post('/api/auth/login').send({ email: bad.email, password: PASSWORD }).expect(200);
  });

  test('Sin token o con token inválido la API responde 401', async () => {
    const { api } = makeApp();
    await api.get('/api/transactions').expect(401);
    const res = await api.get('/api/transactions').set({ Authorization: 'Bearer abc.def.ghi' }).expect(401);
    assert.equal(res.body.message, 'Tu sesión ha expirado. Inicia sesión nuevamente');
  });
});

describe('HU-FIN-03 Recuperación de contraseña por correo', () => {
  const tokenFrom = (sent) => new URL(sent.at(-1).link).searchParams.get('token');

  test('E1 Camino feliz: envía un enlace de un solo uso válido por 30 minutos', async () => {
    const { api, registerAndLogin, sent } = makeApp();
    await registerAndLogin('Ana', 'ana.torres@gmail.com');
    const res = await api.post('/api/auth/forgot-password').send({ email: 'ana.torres@gmail.com' }).expect(200);
    assert.equal(res.body.message, 'Revisa tu bandeja de entrada');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].minutes, 30);
    assert.match(sent[0].link, /restablecer-contrasena\?token=[a-f0-9]{64}$/);
  });

  test('E1b Un correo no registrado recibe la misma respuesta y no se envía nada', async () => {
    const { api, sent } = makeApp();
    const res = await api.post('/api/auth/forgot-password').send({ email: 'nadie@gmail.com' }).expect(200);
    assert.equal(res.body.message, 'Revisa tu bandeja de entrada');
    assert.equal(sent.length, 0);
  });

  test('E2 Flujo alternativo: restablecimiento completado e invalidación del enlace', async () => {
    const { api, registerAndLogin, sent } = makeApp();
    await registerAndLogin('Ana', 'ana.torres@gmail.com');
    await api.post('/api/auth/forgot-password').send({ email: 'ana.torres@gmail.com' });
    const token = tokenFrom(sent);
    const res = await api.post('/api/auth/reset-password').send({ token, password: 'Ahorro#2027', confirmPassword: 'Ahorro#2027' }).expect(200);
    assert.equal(res.body.message, 'Contraseña actualizada correctamente');
    await api.post('/api/auth/login').send({ email: 'ana.torres@gmail.com', password: 'Ahorro#2027' }).expect(200);
    await api.post('/api/auth/reset-password').send({ token, password: 'Otra#20288', confirmPassword: 'Otra#20288' }).expect(400);
  });

  test('E3 Manejo de errores: la confirmación no coincide', async () => {
    const { api, registerAndLogin, sent } = makeApp();
    await registerAndLogin('Ana', 'ana.torres@gmail.com');
    await api.post('/api/auth/forgot-password').send({ email: 'ana.torres@gmail.com' });
    const res = await api.post('/api/auth/reset-password')
      .send({ token: tokenFrom(sent), password: 'Ahorro#2027', confirmPassword: 'Ahorro#2028' })
      .expect(400);
    assert.equal(res.body.message, 'Las contraseñas no coinciden');
  });

  test('E4 Caso de borde: enlace expirado a los 31 minutos', async () => {
    const { api, registerAndLogin, sent, clock } = makeApp();
    await registerAndLogin('Ana', 'ana.torres@gmail.com');
    await api.post('/api/auth/forgot-password').send({ email: 'ana.torres@gmail.com' });
    clock.now = new Date(clock.now.getTime() + 31 * 60000);
    const res = await api.get(`/api/auth/reset-password/${tokenFrom(sent)}`).expect(410);
    assert.equal(res.body.message, 'El enlace ha expirado. Solicita uno nuevo');
  });
});
