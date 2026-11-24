import { MemoryTenantRepository } from './MemoryTenantRepository.js';
import { MemoryUserRepository } from './MemoryUserRepository.js';

export function createMemoryRepositories() {
  return {
    users: new MemoryUserRepository(),
    categories: new MemoryTenantRepository(),
    accounts: new MemoryTenantRepository({ initialBalance: 0, currency: 'PEN' }),
    transactions: new MemoryTenantRepository({ description: '' }),
    budgets: new MemoryTenantRepository(),
  };
}
