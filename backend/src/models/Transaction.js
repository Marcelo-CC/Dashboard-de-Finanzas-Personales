import { Schema, model } from 'mongoose';
import { uuidId, toJSONOptions } from './plugins.js';
import { MOVEMENT_TYPES } from './Category.js';

const transactionSchema = new Schema(
  {
    _id: uuidId,
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(MOVEMENT_TYPES), required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true },
    categoryId: { type: String, required: true, index: true },
    accountId: { type: String, required: true, index: true },
    description: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

transactionSchema.index({ userId: 1, date: -1 });

export const TransactionModel = model('Transaction', transactionSchema);
