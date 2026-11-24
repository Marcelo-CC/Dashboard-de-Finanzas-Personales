import { API_URL, TOKEN_KEY } from '../config';

/** Error de la API con el código HTTP y los errores por campo (details). */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/**
 * Cliente HTTP basado en Fetch API. Adjunta el JWT y, si la API responde 401 estando
 * autenticado, dispara el cierre de sesión ("Tu sesión ha expirado").
 */
export async function request(path, { method = 'GET', body, query, timeoutMs = 10000 } = {}) {
  const url = new URL(API_URL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  const token = localStorage.getItem(TOKEN_KEY);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente');
  } finally {
    clearTimeout(timer);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized(data?.message);
    throw new ApiError(response.status, data?.message || 'Ocurrió un error inesperado', data?.details);
  }
  return data;
}
