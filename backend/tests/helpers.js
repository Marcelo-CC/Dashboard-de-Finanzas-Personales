import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepositories } from '../src/repositories/memory/index.js';
import { ROLES } from '../src/models/index.js';

export const PASSWORD = 'Finanzas#2026';

export const testConfig = {
  clientUrl: 'http://localhost:5173',
  jwtSecret: 'test-secret',
  jwtExpiresIn: '1h',
  resetTokenMinutes: 30,
  security: { maxFailedLogins: 5, lockMinutes: 15, bcryptRounds: 4 },
};

/** App aislada por prueba: repositorios en memoria, correo capturado y reloj controlable. */
export function makeApp() {
  const repos = createMemoryRepositories();
  const sent = [];
  const mailer = { async sendPasswordReset(msg) { sent.push(msg); return { delivered: true }; } };
  const clock = { now: new Date() };
  const { app } = createApp({ repos, mailer, config: testConfig, clock: () => clock.now });
  const api = request(app);

  async function registerAndLogin(name, email, role = ROLES.USER) {
    await api.post('/api/auth/register').send({ name, email, password: PASSWORD, confirmPassword: PASSWORD }).expect(201);
    const user = await repos.users.findByEmail(email);
    if (role !== ROLES.USER) await repos.users.update(user.id, { role });
    const res = await api.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
    return { token: res.body.token, user: res.body.user, auth: { Authorization: `Bearer ${res.body.token}` } };
  }

  return { api, repos, sent, clock, registerAndLogin };
}

/** Helpers de dominio para preparar el "Dado que" de los escenarios. */
export async function category(api, auth, type, name) {
  const list = await api.get(`/api/categories?type=${type}`).set(auth);
  const found = list.body.find((c) => c.name === name);
  if (found) return found;
  return (await api.post('/api/categories').set(auth).send({ name, type }).expect(201)).body;
}

export async function account(api, auth, name, type = 'cash', initialBalance = 0) {
  return (await api.post('/api/accounts').set(auth).send({ name, type, initialBalance }).expect(201)).body;
}

export async function movement(api, auth, { type, amount, date, categoryId, accountId, description = '' }) {
  return api.post('/api/transactions').set(auth).send({ type, amount, date, categoryId, accountId, description });
}
