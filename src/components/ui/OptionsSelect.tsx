'use client';

import classNames from 'classnames';
import type { OrderStatusTone } from '@/settings/business';

const toneStyles: Record<OrderStatusTone, string> = {
  success:
    'border-emerald-200/80 bg-emerald-50 text-emerald-800 focus:border-emerald-400 focus:ring-emerald-400/30',
  danger: 'border-rose-200/80 bg-rose-50 text-rose-800 focus:border-rose-400 focus:ring-rose-400/30',
  warning:
    'border-amber-200/80 bg-amber-50 text-amber-800 focus:border-amber-400 focus:ring-amber-400/30',
  info: 'border-sky-200/80 bg-sky-50 text-sky-800 focus:border-sky-400 focus:ring-sky-400/30',
  primary:
    'border-primary/25 bg-primary/10 text-primary focus:border-primary/50 focus:ring-primary/25',
  neutral: 'border-border bg-input text-foreground focus:border-ring focus:ring-ring/30',
};

export const orderStatusToneStyles = toneStyles;

export function OptionsSelect({
  value,
  onChange,
  options,
  className,
  placeholder = 'Válassz…',
  disabled = false,
  tone,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  tone?: OrderStatusTone;
}) {
  const list = options.length > 0 ? options : [value].filter(Boolean);

  return (
    <select
      className={classNames(
        'h-9 w-full rounded-md border px-3 text-sm font-medium appearance-none focus:ring-2 outline-none',
        tone ? toneStyles[tone] : toneStyles.neutral,
        className,
      )}
      value={list.includes(value) ? value : list[0] ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {list.length === 0 && <option value="">{placeholder}</option>}
      {list.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
      {value && !list.includes(value) && <option value={value}>{value} (régi)</option>}
    </select>
  );
}
