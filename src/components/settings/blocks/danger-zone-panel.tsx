'use client';

import { Trash2 } from 'lucide-react';

export function DangerZonePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/[0.04] via-card to-card overflow-hidden">
      <header className="flex items-start gap-3 px-5 py-4 border-b border-destructive/20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Trash2 size={16} strokeWidth={2.2} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}
