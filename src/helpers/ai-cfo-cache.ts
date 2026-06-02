export function buildAiCfoCacheKey(
  walletId: number,
  year: number,
  month: number,
  dataFingerprint?: string,
): string {
  const base = `${walletId}-${year}-${month}`;
  return dataFingerprint ? `${base}:${dataFingerprint}` : base;
}
