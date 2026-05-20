/** Laravel JsonResource válasz: { data: T } vagy közvetlen T */
export function unwrapApiResource<T>(payload: T | { data: T }): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data: T }).data !== undefined &&
    (payload as { data: T }).data !== null
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
