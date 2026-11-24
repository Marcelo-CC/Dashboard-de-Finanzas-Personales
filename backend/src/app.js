import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { buildServices } from './container.js';
import { buildRouter } from './routes/index.js';
import { authenticate } from './middlewares/authenticate.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

/** Crea la app Express a partir de repositorios inyectados (Mongo en producción, memoria en pruebas). */
export function createApp({ repos, mailer, config, clock }) {
  const services = buildServices({ repos, mailer, config, clock });
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.clientUrl.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', buildRouter({ services, auth: authenticate({ jwtSecret: config.jwtSecret, users: repos.users }) }));
  app.use(notFound);
  app.use(errorHandler);

  return { app, services };
}
