'use client';

import { Loader2, MousePointerClick } from 'lucide-react';
import { StatusPill } from './StatusPill';
import classNames from 'classnames';

type Status = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

interface StatusToggleButtonProps {
  status: Status;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  pending?: boolean;
  children: React.ReactNode;
}

export function StatusToggleButton({
  status,
  onClick,
  title,
  disabled,
  pending,
  children,
}: StatusToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      title={title}
      aria-label={title}
      className={classNames(
        'group inline-flex max-w-full items-center gap-1 rounded-lg px-1 py-0.5',
        'cursor-pointer transition-all duration-150',
        'border border-transparent hover:border-border/80 hover:bg-muted/50 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
        'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <StatusPill status={status} size="xs" dot className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 group-hover:decoration-primary/60">
        {pending ? (
          <>
            <Loader2 size={9} className="animate-spin shrink-0" aria-hidden />
            Mentés…
          </>
        ) : (
          children
        )}
      </StatusPill>
      {!pending && (
        <MousePointerClick
          size={11}
          strokeWidth={2.2}
          aria-hidden
          className="shrink-0 text-muted-foreground/35 transition-colors group-hover:text-primary/80"
        />
      )}
    </button>
  );
}
