/** Envuelve controladores async (Express 5 ya propaga promesas; se mantiene por claridad). */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
