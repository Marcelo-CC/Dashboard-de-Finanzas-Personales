import 'dotenv/config';

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  timezone: process.env.APP_TIMEZONE || 'America/Lima',
  dataDriver: (process.env.DATA_DRIVER || 'mongo').toLowerCase(),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dashboard_finanzas',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 465),
    secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  mailFrom: process.env.MAIL_FROM || 'Dashboard de Finanzas <no-reply@finanzas.local>',
  resetTokenMinutes: toInt(process.env.RESET_TOKEN_MINUTES, 30),
  security: {
    maxFailedLogins: 5,
    lockMinutes: 15,
    bcryptRounds: 10,
  },
});
