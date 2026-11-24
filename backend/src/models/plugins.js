import { v4 as uuidv4 } from 'uuid';

/** _id tipo UUID v4 (requisito: generación de identificadores con UUID). */
export const uuidId = { type: String, default: () => uuidv4() };

/** Serializa _id como id y elimina campos internos en las respuestas JSON. */
export const toJSONOptions = (hidden = []) => ({
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    for (const field of hidden) delete ret[field];
    return ret;
  },
});
