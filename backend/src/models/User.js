import { Schema, model } from 'mongoose';
import { uuidId, toJSONOptions } from './plugins.js';

import { ROLES } from '../domain/constants.js';

export { ROLES };

const userSchema = new Schema(
  {
    _id: uuidId,
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    active: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
    roleChangedAt: { type: Date, default: null },
    roleChangedBy: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: toJSONOptions(['passwordHash', 'resetTokenHash', 'resetTokenExpires', 'failedLoginAttempts', 'lockUntil']),
  },
);

export const UserModel = model('User', userSchema);
