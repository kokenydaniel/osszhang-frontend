'use client';

import classNames from 'classnames';
import { yearlyFreeMonths } from '@/lib/subscriptionPlans';
import type { BillingInterval } from '@/lib/subscriptionPlans';

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
        'inline-flex items-center rounded-full border border-border bg-muted/40 p-1',
        className,
      )}
      role="group"
      aria-label="Számlázási időszak"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={classNames(
          'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
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
          'rounded-full px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5',
          value === 'yearly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Éves
        {freeMonths > 0 && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700 dark:text-emerald-400">
            {freeMonths} hó ingyen
          </span>
        )}
      </button>
    </div>
  );
}
