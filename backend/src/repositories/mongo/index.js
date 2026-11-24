import { CategoryModel, AccountModel, TransactionModel, BudgetModel } from '../../models/index.js';
import { MongoTenantRepository } from './MongoTenantRepository.js';
import { MongoUserRepository } from './MongoUserRepository.js';

export function createMongoRepositories() {
  return {
    users: new MongoUserRepository(),
    categories: new MongoTenantRepository(CategoryModel),
    accounts: new MongoTenantRepository(AccountModel),
    transactions: new MongoTenantRepository(TransactionModel),
    budgets: new MongoTenantRepository(BudgetModel),
  };
}
