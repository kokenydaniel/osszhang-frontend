'use client';

import { ChevronDown, MousePointerClick } from 'lucide-react';
import classNames from 'classnames';

export interface ClickableSelectOption {
  value: string;
  label: string;
}

export function ClickableSelect({
  value,
  onChange,
  options,
  title,
  disabled,
  className,
  tone = 'neutral',
}: {
  value: string;
  onChange: (value: string) => void;
  options: ClickableSelectOption[];
  title: string;
  disabled?: boolean;
  className?: string;
  tone?: 'neutral' | 'warning' | 'success';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:border-emerald-300'
      : tone === 'warning'
        ? 'border-amber-200/80 bg-amber-50 text-amber-800 hover:border-amber-300'
        : 'border-border bg-muted/30 text-foreground hover:border-primary/30 hover:bg-muted/50';

  return (
    <label
      title={title}
      className={classNames(
        'group relative inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-1 transition-all',
        'cursor-pointer focus-within:ring-2 focus-within:ring-primary/30',
        disabled && 'cursor-not-allowed opacity-60',
        toneClass,
        className,
      )}
    >
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title}
        className={classNames(
          'min-w-0 max-w-full cursor-pointer appearance-none bg-transparent pr-5 text-xs font-medium outline-none',
          disabled && 'cursor-not-allowed',
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        strokeWidth={2.5}
        className="pointer-events-none absolute right-1.5 text-muted-foreground/70 group-hover:text-primary/80"
        aria-hidden
      />
      <MousePointerClick
        size={10}
        strokeWidth={2.2}
        className="pointer-events-none shrink-0 text-muted-foreground/30 group-hover:text-primary/70"
        aria-hidden
      />
    </label>
  );
}
