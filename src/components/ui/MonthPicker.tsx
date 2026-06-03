'use client';

import { DatePicker } from '@/components/ui/DatePicker';
import { toDayjs } from '@/utils/dates';

export type MonthPickerProps = {
  value: string;
  onChange: (yearMonth: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/** `YYYY-MM` ↔ DatePicker (a nap csak technikai, a hónap számít). */
function toPickerValue(yearMonth: string): string {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) return '';
  return `${yearMonth}-01`;
}

function fromPickerValue(date: string): string {
  if (!date.trim()) return '';
  const parsed = toDayjs(date);
  return parsed.isValid() ? parsed.format('YYYY-MM') : '';
}

export function MonthPicker({
  value,
  onChange,
  placeholder = 'Válassz hónapot',
  className,
  disabled,
}: MonthPickerProps) {
  return (
    <DatePicker
      value={toPickerValue(value)}
      onChange={(date) => onChange(fromPickerValue(date))}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}
