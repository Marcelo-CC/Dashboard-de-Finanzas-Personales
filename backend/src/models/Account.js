import { Schema, model } from 'mongoose';
import { uuidId, toJSONOptions } from './plugins.js';

import { ACCOUNT_TYPES } from '../domain/constants.js';

export { ACCOUNT_TYPES };

const accountSchema = new Schema(
  {
    _id: uuidId,
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    type: { type: String, enum: Object.values(ACCOUNT_TYPES), required: true },
    initialBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'PEN' },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

export const AccountModel = model('Account', accountSchema);
