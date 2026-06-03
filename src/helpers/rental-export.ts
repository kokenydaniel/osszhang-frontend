import type { RentalIncomeEntry, RentalProperty } from '@/types/rental';
function escapeCsvCell(value: string | number): string {
  const s = String(value ?? '');
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildRentalIncomeCsv(
  properties: RentalProperty[],
  entries: RentalIncomeEntry[],
  year: number,
): string {
  const byId = new Map(properties.map((p) => [p.id, p]));
  const header = [
    'Ingatlan',
    'Cím',
    'Bérlő',
    'Év',
    'Hónap',
    'Összeg',
    'Pénznem',
    'Befizetés napja',
    'Megjegyzés',
    'Havi bérleti díj',
    'Közös költség',
    'Szerződés vége',
  ];
  const rows = entries
    .filter((e) => e.periodYear === year)
    .sort((a, b) => a.periodMonth - b.periodMonth || a.rentalPropertyId - b.rentalPropertyId)
    .map((e) => {
      const p = byId.get(e.rentalPropertyId);
      return [
        p?.name ?? '',
        p?.address ?? '',
        p?.tenantName ?? '',
        e.periodYear,
        e.periodMonth,
        e.amount,
        e.currency,
        e.paidDate ?? '',
        e.note ?? '',
        p?.monthlyRent ?? '',
        p?.monthlyCommonCost ?? '',
        p?.contractEndsAt ?? '',
      ];
    });

  const lines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(';'));
  return `\uFEFF${lines.join('\n')}`;
}

export function downloadRentalCsv(
  properties: RentalProperty[],
  entries: RentalIncomeEntry[],
  year: number,
): void {
  const csv = buildRentalIncomeCsv(properties, entries, year);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `berbeadas-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function rentalExportApiUrl(year: number): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  const trimmed = base.replace(/\/$/, '');
  return `${trimmed}/rental-properties/export?year=${year}`;
}

export function exportRentalYear(
  properties: RentalProperty[],
  entries: RentalIncomeEntry[],
  year: number,
): void {
  downloadRentalCsv(properties, entries, year);
}
