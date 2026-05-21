/** Magyar megjelenítés: vezetéknév, majd keresztnév */
export function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const last = lastName?.trim() ?? '';
  const first = firstName?.trim() ?? '';
  if (last && first) return `${last} ${first}`;
  return last || first || '';
}

/** Monogram: vezetéknév + keresztnév kezdőbetűje */
export function formatDisplayInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const last = (lastName?.trim() || '?')[0];
  const first = (firstName?.trim() || '?')[0];
  return `${last}${first}`.toUpperCase();
}

/** Köszönéshez: keresztnév, ha van */
export function formatGivenName(firstName?: string | null): string {
  return firstName?.trim() || '';
}
