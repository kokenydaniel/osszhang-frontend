'use client';

import { cn } from '@/lib/utils';

export function OptionsSelect({
  value,
  onChange,
  options,
  className,
  placeholder = 'Válassz…',
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  placeholder?: string;
}) {
  const list = options.length > 0 ? options : [value].filter(Boolean);

  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none',
        className,
      )}
      value={list.includes(value) ? value : list[0] ?? ''}
      onChange={(e) => onChange(e.target.value)}
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
