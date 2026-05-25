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
        'flex w-full max-w-full items-stretch rounded-full border border-border bg-muted/40 p-1 sm:inline-flex sm:w-auto sm:items-center',
        className,
      )}
      role="group"
      aria-label="Számlázási időszak"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={classNames(
          'flex-1 rounded-full px-3 py-2 text-sm font-medium transition-all sm:flex-none sm:px-4 sm:py-1.5',
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
          'flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-sm font-medium transition-all sm:flex-none sm:flex-row sm:gap-1.5 sm:px-4 sm:py-1.5',
          value === 'yearly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span>Éves</span>
        {freeMonths > 0 && (
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.6rem] font-semibold leading-none text-emerald-700 dark:text-emerald-400 sm:px-2 sm:text-[0.65rem]">
            {freeMonths} hó ingyen
          </span>
        )}
      </button>
    </div>
  );
}
