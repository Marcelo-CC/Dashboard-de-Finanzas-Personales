import { CategoryService } from './services/CategoryService.js';
import { AccountService } from './services/AccountService.js';
import { BudgetService } from './services/BudgetService.js';
import { TransactionService } from './services/TransactionService.js';
import { DashboardService } from './services/DashboardService.js';
import { AuthService } from './services/AuthService.js';
import { UserAdminService } from './services/UserAdminService.js';

/**
 * Raíz de composición (inyección de dependencias): los servicios reciben sus repositorios
 * por constructor, por lo que dependen de abstracciones y no de Mongoose (principio D de SOLID).
 */
export function buildServices({ repos, mailer, config, clock }) {
  const categories = new CategoryService(repos);
  const accounts = new AccountService(repos);
  const budgets = new BudgetService(repos);
  const transactions = new TransactionService({ ...repos, accountService: accounts, budgetService: budgets });
  const dashboard = new DashboardService({ ...repos, budgetService: budgets });
  const auth = new AuthService({ users: repos.users, categoryService: categories, mailer, config, clock });
  const admin = new UserAdminService({ users: repos.users, clock });
  return { auth, categories, accounts, budgets, transactions, dashboard, admin };
}
