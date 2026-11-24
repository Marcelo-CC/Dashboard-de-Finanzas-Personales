/**
 * Carga datos de demostración en MongoDB:  npm run seed
 * Con "--reset" elimina primero las colecciones del proyecto:  npm run seed -- --reset
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { createMongoRepositories } from '../repositories/mongo/index.js';
import { buildServices } from '../container.js';
import { createMailer } from '../services/mailer.js';
import { seedDemoData } from './demoData.js';
import { UserModel, CategoryModel, AccountModel, TransactionModel, BudgetModel } from '../models/index.js';

try {
  await connectDatabase(env.mongoUri);
  if (process.argv.includes('--reset')) {
    for (const M of [UserModel, CategoryModel, AccountModel, TransactionModel, BudgetModel]) await M.deleteMany({});
    console.log('Colecciones vaciadas.');
  }
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).syncIndexes()));
  const repos = createMongoRepositories();
  const services = buildServices({ repos, mailer: createMailer(env), config: env });
  const users = await seedDemoData({ repos, services });
  console.log('Datos de demostración listos. Usuarios:');
  for (const u of users) console.log(`  ${u.role.padEnd(5)}  ${u.email}  /  ${u.password}`);
} catch (err) {
  console.error('Error al cargar los datos:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
