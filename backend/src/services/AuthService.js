import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { ROLES } from '../domain/constants.js';
import { validateRegister, validateLogin, validateForgot, validateReset } from '../validators/auth.validators.js';

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

export const DEFAULT_CATEGORIES = Object.freeze([
  { name: 'Sueldo', type: 'income' },
  { name: 'Alimentación', type: 'expense' },
  { name: 'Transporte', type: 'expense' },
  { name: 'Vivienda', type: 'expense' },
  { name: 'Ocio', type: 'expense' },
]);

export const toPublicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  active: u.active,
  createdAt: u.createdAt,
});

export class AuthService {
  constructor({ users, categoryService, mailer, config, clock = () => new Date() }) {
    this.users = users;
    this.categoryService = categoryService;
    this.mailer = mailer;
    this.config = config;
    this.now = clock;
  }

  signToken(user) {
    return jwt.sign({ sub: user.id, role: user.role, name: user.name }, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      algorithm: 'HS256',
    });
  }

  async register(body) {
    const data = validateRegister(body);
    if (await this.users.findByEmail(data.email)) {
      throw AppError.conflict('El correo electrónico ya se encuentra registrado', { email: 'El correo electrónico ya se encuentra registrado' });
    }
    const passwordHash = await bcrypt.hash(data.password, this.config.security.bcryptRounds);
    const user = await this.users.create({ name: data.name, email: data.email, passwordHash, role: ROLES.USER });
    await this.categoryService.createDefaults(user.id, DEFAULT_CATEGORIES);
    return toPublicUser(user);
  }

  async login(body) {
    const { email, password } = validateLogin(body);
    const user = await this.users.findByEmail(email);
    if (!user) throw AppError.unauthorized(INVALID_CREDENTIALS);

    const now = this.now();
    const { maxFailedLogins, lockMinutes } = this.config.security;
    if (user.lockUntil && new Date(user.lockUntil) > now) {
      const mins = Math.ceil((new Date(user.lockUntil) - now) / 60000);
      throw AppError.locked(`Cuenta bloqueada temporalmente. Intenta nuevamente en ${mins} minutos`);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      if (attempts >= maxFailedLogins) {
        await this.users.update(user.id, { failedLoginAttempts: 0, lockUntil: new Date(now.getTime() + lockMinutes * 60000) });
        throw AppError.locked(`Cuenta bloqueada temporalmente. Intenta nuevamente en ${lockMinutes} minutos`);
      }
      await this.users.update(user.id, { failedLoginAttempts: attempts });
      throw AppError.unauthorized(INVALID_CREDENTIALS);
    }

    if (!user.active) throw AppError.forbidden('Tu cuenta está desactivada. Contacta al administrador de la plataforma');

    await this.users.update(user.id, { failedLoginAttempts: 0, lockUntil: null });
    return { token: this.signToken(user), user: toPublicUser(user) };
  }

  async me(actor) {
    const user = await this.users.findById(actor.id);
    if (!user || !user.active) throw AppError.unauthorized('Tu sesión ha expirado. Inicia sesión nuevamente');
    return toPublicUser(user);
  }

  /** Siempre responde igual para no revelar qué correos existen (enumeración de usuarios). */
  async forgotPassword(body) {
    const { email } = validateForgot(body);
    const user = await this.users.findByEmail(email);
    if (user && user.active) {
      const token = crypto.randomBytes(32).toString('hex');
      const minutes = this.config.resetTokenMinutes;
      await this.users.update(user.id, {
        resetTokenHash: sha256(token),
        resetTokenExpires: new Date(this.now().getTime() + minutes * 60000),
      });
      const link = `${this.config.clientUrl}/restablecer-contrasena?token=${token}`;
      await this.mailer.sendPasswordReset({ to: user.email, name: user.name, link, minutes });
    }
    return { message: 'Revisa tu bandeja de entrada' };
  }

  async #userForToken(token) {
    const user = token ? await this.users.findOne({ resetTokenHash: sha256(String(token)) }) : null;
    if (!user) throw AppError.badRequest('El enlace de restablecimiento no es válido o ya fue utilizado');
    if (!user.resetTokenExpires || new Date(user.resetTokenExpires) < this.now()) {
      throw new AppError(410, 'El enlace ha expirado. Solicita uno nuevo');
    }
    return user;
  }

  async verifyResetToken(token) {
    await this.#userForToken(token);
    return { valid: true };
  }

  async resetPassword(body) {
    const { token, password } = validateReset(body);
    const user = await this.#userForToken(token);
    const passwordHash = await bcrypt.hash(password, this.config.security.bcryptRounds);
    await this.users.update(user.id, {
      passwordHash,
      resetTokenHash: null, // un solo uso
      resetTokenExpires: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
