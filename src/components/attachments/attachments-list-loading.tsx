'use client';

import { Loader2 } from 'lucide-react';

export function AttachmentsListLoading() {
  return (
    <div
      className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
      <span>Dokumentumok betöltése…</span>
    </div>
  );
}
