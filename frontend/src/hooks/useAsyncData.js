import { useCallback, useEffect, useState } from 'react';

/**
 * Hook reutilizable para cargar datos de la API con estados de carga y error (DRY).
 * Devuelve { data, error, loading, reload }. Al recargar conserva los datos previos para evitar parpadeos.
 *
 * const { data, error, loading, reload } = useAsyncData(() => accountsApi.list(), []);
 */
export function useAsyncData(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: '', loading: true });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await loader();
      setState({ data, error: '', loading: false });
      return data;
    } catch (err) {
      setState((s) => ({ ...s, error: err.message, loading: false }));
      return null;
    }
  }, deps);

  useEffect(() => { reload(); }, [reload]);

  return { ...state, reload };
}
