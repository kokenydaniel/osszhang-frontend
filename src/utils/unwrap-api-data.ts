export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data: unknown }).data;
    if (nested && typeof nested === 'object') {
      return nested as T;
    }
  }
  return payload as T;
}
