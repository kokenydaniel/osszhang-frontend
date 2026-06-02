'use client';

import classNames from 'classnames';
import { yearlyFreeMonths } from '@/config/billing/subscription-plans';
import type { BillingInterval } from '@/config/billing/subscription-plans';

interface BillingIntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
}

export function BillingIntervalToggle({ value, onChange, className }: BillingIntervalToggleProps) {
  const freeMonths = Math.max(yearlyFreeMonths('pro'), yearlyFreeMonths('premium'));

  return (
    <div
      className={classNames(
        'inline-flex shrink-0 items-center rounded-full border border-border bg-muted/40 p-1',
        className,
      )}
      role="group"
      aria-label="Számlázási időszak"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={classNames(
          'rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
          value === 'monthly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Havi
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={classNames(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
          value === 'yearly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Éves
        {freeMonths > 0 && (
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.6rem] font-semibold leading-none text-emerald-700 dark:text-emerald-400">
            {freeMonths} hó ingyen
          </span>
        )}
      </button>
    </div>
  );
}
