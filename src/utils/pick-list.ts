export function pickList(list: string[] | undefined, fallback: string[]): string[] {
  if (list === undefined) return [...fallback];
  const clean = list.map((s) => s.trim()).filter(Boolean);
  return [...new Set(clean)];
}
