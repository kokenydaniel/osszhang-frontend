'use client';

import classNames from 'classnames';
import type { OrderStatusTone } from '@/settings/business';
import { ORDER_STATUS_TONE_LABELS, ORDER_STATUS_TONES } from '@/settings/business';
import { orderStatusToneStyles } from './OptionsSelect';

export function OrderStatusToneSelect({
  value,
  onChange,
  className,
  disabled = false,
}: {
  value: OrderStatusTone;
  onChange: (tone: OrderStatusTone) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      className={classNames(
        'h-9 w-full rounded-md border px-3 text-sm font-medium appearance-none focus:ring-2 outline-none',
        orderStatusToneStyles[value],
        className,
      )}
      value={value}
      onChange={(e) => onChange(e.target.value as OrderStatusTone)}
      disabled={disabled}
    >
      {ORDER_STATUS_TONES.map((tone) => (
        <option key={tone} value={tone}>
          {ORDER_STATUS_TONE_LABELS[tone]}
        </option>
      ))}
    </select>
  );
}
