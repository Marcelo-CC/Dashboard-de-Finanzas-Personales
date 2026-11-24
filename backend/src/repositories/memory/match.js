const val = (v) => (v instanceof Date ? v.getTime() : v);

function matchValue(actual, cond) {
  if (cond !== null && typeof cond === 'object' && !(cond instanceof Date) && !Array.isArray(cond)) {
    return Object.entries(cond).every(([op, expected]) => {
      const a = val(actual);
      const e = val(expected);
      switch (op) {
        case '$gte': return a >= e;
        case '$lte': return a <= e;
        case '$gt': return a > e;
        case '$lt': return a < e;
        case '$ne': return a !== e;
        case '$in': return expected.map(val).includes(a);
        default: throw new Error(`Operador no soportado en repositorio en memoria: ${op}`);
      }
    });
  }
  return val(actual) === val(cond);
}

export const matches = (doc, filter = {}) =>
  Object.entries(filter).every(([field, cond]) => matchValue(field === '_id' ? doc.id : doc[field], cond));

export function sortDocs(docs, sort = {}) {
  const keys = Object.entries(sort);
  return [...docs].sort((x, y) => {
    for (const [k, dir] of keys) {
      const a = val(x[k]);
      const b = val(y[k]);
      if (a < b) return -1 * dir;
      if (a > b) return 1 * dir;
    }
    return 0;
  });
}
