export type FileAttachment = {
  id: number;
  originalName: string;
  mime: string | null;
  sizeBytes: number;
  createdAt: string | null;
};

export type BusinessDocumentType =
  | 'bank_statement'
  | 'sumup_report'
  | 'barion_report'
  | 'market_receipt'
  | 'other';

export type BusinessDocument = FileAttachment & {
  year: number;
  month: number;
  documentType: BusinessDocumentType;
  businessOrderId: number | null;
  label: string | null;
  source?: 'manual' | 'sumup' | string;
  importKey?: string | null;
};
