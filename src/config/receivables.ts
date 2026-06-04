export const RECEIVABLE_ENTRY_TYPES = ['lent', 'repaid'] as const;
export type ReceivableEntryType = (typeof RECEIVABLE_ENTRY_TYPES)[number];

export const RECEIVABLE_SOURCES = ['savings', 'transfer', 'cash'] as const;
export type ReceivableSource = (typeof RECEIVABLE_SOURCES)[number];

export const RECEIVABLE_ENTRY_TYPE_LABELS: Record<ReceivableEntryType, string> = {
  lent: 'Kiadtam / kölcsön',
  repaid: 'Visszakaptam',
};

export const RECEIVABLE_SOURCE_LABELS: Record<ReceivableSource, string> = {
  savings: 'Megtakarításból',
  transfer: 'Átutalás',
  cash: 'Készpénz',
};

export const RECEIVABLE_DEFAULT_CURRENCY = 'HUF';
