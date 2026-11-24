import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { categoryController } from '../controllers/category.controller.js';
import { accountController } from '../controllers/account.controller.js';
import { transactionController } from '../controllers/transaction.controller.js';
import { budgetController } from '../controllers/budget.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { adminController } from '../controllers/admin.controller.js';
import { requireRole } from '../middlewares/requireRole.js';
import { ROLES } from '../models/index.js';

export function buildRouter({ services, auth }) {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // ---- Autenticación (público) ----
  const a = authController(services.auth);
  router.post('/auth/register', a.register);
  router.post('/auth/login', a.login);
  router.post('/auth/forgot-password', a.forgotPassword);
  router.get('/auth/reset-password/:token', a.verifyResetToken);
  router.post('/auth/reset-password', a.resetPassword);

  // ---- A partir de aquí todo requiere un JWT válido ----
  router.use(auth);
  router.get('/auth/me', a.me);

  const c = categoryController(services.categories);
  router.get('/categories', c.list);
  router.post('/categories', c.create);
  router.patch('/categories/:id', c.rename);
  router.delete('/categories/:id', c.remove);

  const ac = accountController(services.accounts);
  router.get('/accounts', ac.list);
  router.post('/accounts', ac.create);
  router.patch('/accounts/:id', ac.update);
  router.delete('/accounts/:id', ac.remove);

  const t = transactionController(services.transactions);
  router.get('/transactions', t.list);
  router.post('/transactions', t.create);
  router.get('/transactions/:id', t.getOne);
  router.put('/transactions/:id', t.update);
  router.delete('/transactions/:id', t.remove);

  const b = budgetController(services.budgets);
  router.put('/budgets', b.upsert);
  router.get('/budgets/:month', b.status);
  router.delete('/budgets/:month', b.remove);

  const d = dashboardController(services.dashboard);
  router.get('/dashboard/summary', d.summary);
  router.get('/dashboard/charts', d.charts);

  // ---- Administración (RBAC: solo ADMIN) ----
  const adm = adminController(services.admin);
  router.get('/admin/users', requireRole(ROLES.ADMIN), adm.list);
  router.patch('/admin/users/:id/role', requireRole(ROLES.ADMIN), adm.changeRole);
  router.patch('/admin/users/:id/status', requireRole(ROLES.ADMIN), adm.setActive);

  return router;
}
