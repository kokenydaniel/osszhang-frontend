import type { BusinessDocumentType } from '@/types/attachments';

export type BusinessDocumentTypeMeta = {
  id: BusinessDocumentType;
  label: string;
  hint: string;
  optional?: boolean;
};

/** Havi könyvelési csomag — dokumentum típusok. */
export const BUSINESS_DOCUMENT_TYPES: BusinessDocumentTypeMeta[] = [
  {
    id: 'bank_statement',
    label: 'Banki kivonat',
    hint: 'A bankszámla havi kivonata (PDF vagy export). Kézzel töltöd fel.',
  },
  {
    id: 'sumup_report',
    label: 'SumUp kimutatás',
    hint: 'Automatikus import: csak ha volt SumUp forgalom (XLS, bevételi PDF, nyugták) vagy kifizetés (PDF). Üres hónapnál nem készül fájl. Kézi feltöltés bármikor lehetséges.',
  },
  {
    id: 'barion_report',
    label: 'Barion / kártyás elszámolás',
    hint: 'Barion (vagy más fizetési szolgáltató) havi riportja — kézzel feltöltve.',
  },
  {
    id: 'market_receipt',
    label: 'Piaci nyugta (KP)',
    hint: 'Ha volt piaci eladás készpénzben: a nyugta szkennelése / fotója. Opcionálisan összekötheted egy rendeléssel.',
  },
  {
    id: 'other',
    label: 'Egyéb',
    hint: 'Bármilyen további könyvelési melléklet erre a hónapra.',
    optional: true,
  },
];

export function businessDocumentTypeLabel(type: BusinessDocumentType): string {
  return BUSINESS_DOCUMENT_TYPES.find((t) => t.id === type)?.label ?? type;
}
