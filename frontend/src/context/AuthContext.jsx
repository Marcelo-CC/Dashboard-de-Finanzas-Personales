import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { authApi } from '../api/services';
import { setUnauthorizedHandler } from '../api/client';
import { TOKEN_KEY } from '../config';

export const AuthContext = createContext(undefined);

/** Estado global de autenticación (Context API): token JWT, usuario actual y acciones. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback((message) => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    if (message) toast.info(message, { toastId: 'session' });
  }, []);

  // Si la API responde 401 con token (expirado o cuenta desactivada) se cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(() => logout('Tu sesión ha expirado. Inicia sesión nuevamente'));
  }, [logout]);

  // Sesión vigente al recargar la página: se valida el token guardado.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: u } = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), isAdmin: user?.role === 'ADMIN', login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
