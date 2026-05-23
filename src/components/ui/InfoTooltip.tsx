'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import classNames from 'classnames';

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
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
          className={classNames(
            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            'text-muted-foreground/75 hover:text-primary hover:bg-primary/8 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            open && 'bg-primary/10 text-primary ring-1 ring-primary/15',
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
        sideOffset={10}
        className="z-[450] text-left whitespace-normal pointer-events-auto"
        onPointerDownOutside={() => setOpen(false)}
      >
        <span className="block text-[13px] leading-[1.5] text-foreground/88">
          {content}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

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
    <span className={classNames('inline-flex items-center gap-1.5 min-w-0', className)}>
      <span className="truncate">{children}</span>
      <InfoTooltip content={info} />
    </span>
  );
}
