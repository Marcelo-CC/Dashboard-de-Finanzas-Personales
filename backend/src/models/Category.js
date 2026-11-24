import { Schema, model } from 'mongoose';
import { uuidId, toJSONOptions } from './plugins.js';

import { MOVEMENT_TYPES } from '../domain/constants.js';

export { MOVEMENT_TYPES };

const categorySchema = new Schema(
  {
    _id: uuidId,
    userId: { type: String, required: true, index: true }, // aislamiento multiinquilino
    name: { type: String, required: true, trim: true, maxlength: 40 },
    nameKey: { type: String, required: true }, // nombre en minúsculas para unicidad sin distinguir mayúsculas
    type: { type: String, enum: Object.values(MOVEMENT_TYPES), required: true },
  },
  { timestamps: true, toJSON: toJSONOptions(['nameKey']) },
);

categorySchema.index({ userId: 1, type: 1, nameKey: 1 }, { unique: true });

export const CategoryModel = model('Category', categorySchema);
