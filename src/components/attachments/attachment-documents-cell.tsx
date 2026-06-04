'use client';

import { FileText } from 'lucide-react';

type AttachmentDocumentsCellProps = {
  count: number;
  enabled: boolean;
  onOpen: () => void;
};

export function AttachmentDocumentsCell({ count, enabled, onOpen }: AttachmentDocumentsCellProps) {
  if (!enabled) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }

  if (count <= 0) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
      >
        Nincs
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 underline-offset-2 hover:underline"
    >
      <FileText size={13} className="shrink-0" />
      <span className="tabular-nums">{count} fájl</span>
    </button>
  );
}
