'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';

export interface FormChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  example?: string;
  icon?: LucideIcon;
  badge?: string;
  warning?: string;
  className?: string;
}

/** Mobilbarát választókártya — a magyarázat mindig látható, nem csak tooltipben. */
export function FormChoiceCard({
  selected,
  onSelect,
  title,
  description,
  example,
  icon: Icon,
  badge,
  warning,
  className,
}: FormChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={classNames(
        'w-full cursor-pointer rounded-lg border p-3.5 text-left transition-all active:scale-[0.99]',
        selected
          ? 'border-primary/50 bg-primary/[0.06] ring-1 ring-primary/20 shadow-sm'
          : 'border-border bg-card hover:border-foreground/20 hover:bg-muted/30',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={classNames(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            selected ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-transparent',
          )}
          aria-hidden
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {Icon && (
              <span
                className={classNames(
                  'inline-flex h-6 w-6 items-center justify-center rounded-md',
                  selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon size={13} strokeWidth={2.2} />
              </span>
            )}
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {badge && (
              <span className="text-[0.65rem] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[0.78rem] text-muted-foreground leading-relaxed">{description}</p>
          {example && (
            <p className="mt-1 text-[0.7rem] text-muted-foreground/80 italic">Példa: {example}</p>
          )}
          {selected && warning && (
            <p className="mt-2 text-[0.72rem] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1.5 leading-snug">
              {warning}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
