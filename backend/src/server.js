import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';
import { createMongoRepositories } from './repositories/mongo/index.js';
import { createMemoryRepositories } from './repositories/memory/index.js';
import { createMailer } from './services/mailer.js';
import { seedDemoData } from './scripts/demoData.js';

async function main() {
  let repos;
  if (env.dataDriver === 'memory') {
    repos = createMemoryRepositories();
    console.log('Modo DEMO: datos en memoria (se pierden al reiniciar).');
  } else {
    await connectDatabase(env.mongoUri);
    repos = createMongoRepositories();
  }

  const { app, services } = createApp({ repos, mailer: createMailer(env), config: env });

  if (env.dataDriver === 'memory') {
    const creds = await seedDemoData({ repos, services, config: env });
    console.log('Usuarios demo:', creds.map((c) => `${c.email} / ${c.password} (${c.role})`).join(' | '));
  }

  app.listen(env.port, () => console.log(`API lista en http://localhost:${env.port}/api`));
}

main().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});
