import { Schema, model } from 'mongoose';
import { uuidId, toJSONOptions } from './plugins.js';

const budgetSchema = new Schema(
  {
    _id: uuidId,
    userId: { type: String, required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ }, // 'YYYY-MM'
    amount: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const BudgetModel = model('Budget', budgetSchema);
