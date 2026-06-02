export function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const last = lastName?.trim() ?? '';
  const first = firstName?.trim() ?? '';
  if (last && first) return `${last} ${first}`;
  return last || first || '';
}

export function formatDisplayInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const last = (lastName?.trim() || '?')[0];
  const first = (firstName?.trim() || '?')[0];
  return `${last}${first}`.toUpperCase();
}

export function formatGivenName(firstName?: string | null): string {
  return firstName?.trim() || '';
}
