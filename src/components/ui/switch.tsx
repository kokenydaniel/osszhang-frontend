'use client';

import * as React from 'react';
import classNames from 'classnames';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Natív checkbox + peer — stabil kinézet, nem csúszik ki a gomb */
export function Switch({ checked, onCheckedChange, disabled, id, className }: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={classNames(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer select-none items-center',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={classNames(
          'pointer-events-none absolute inset-0 rounded-full transition-colors duration-200',
          'bg-muted-foreground/35 peer-checked:bg-primary',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30',
        )}
      />
      <span
        aria-hidden
        className={classNames(
          'pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow-sm',
          'transition-transform duration-200 ease-in-out',
          'peer-checked:translate-x-5',
        )}
      />
    </label>
  );
}
