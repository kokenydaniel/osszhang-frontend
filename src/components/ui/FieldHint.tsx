'use client';

import { cn } from '@/lib/utils';

/** Mindig látható rövid magyarázat — mobilon is olvasható (tooltip helyett / mellett). */
export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p className={cn('text-[0.72rem] text-muted-foreground leading-snug', className)}>{children}</p>
  );
}
