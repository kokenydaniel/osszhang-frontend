'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Accessible label for screen readers */
  label?: string;
}

export function InfoTooltip({
  content,
  className,
  side = 'top',
  label = 'További információ',
}: InfoTooltipProps) {
  const [open, setOpen] = React.useState(false);

  if (!content) return null;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            'text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            open && 'bg-muted text-foreground',
            className,
          )}
          aria-label={label}
          aria-expanded={open}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
        >
          <Info size={12} strokeWidth={2.25} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={6}
        className={cn(
          'z-[450] max-w-[min(20rem,calc(100vw-2rem))] text-left leading-relaxed font-normal whitespace-normal',
          'pointer-events-auto',
        )}
        onPointerDownOutside={() => setOpen(false)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/** Inline label text + optional info icon (for section titles, table headers) */
export function LabelWithInfo({
  children,
  info,
  className,
}: {
  children: React.ReactNode;
  info: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 min-w-0', className)}>
      <span className="truncate">{children}</span>
      <InfoTooltip content={info} />
    </span>
  );
}
