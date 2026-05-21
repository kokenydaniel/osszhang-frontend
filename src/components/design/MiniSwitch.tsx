'use client';

import classNames from 'classnames';

interface MiniSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  title?: string;
  tone?: 'primary' | 'success';
  disabled?: boolean;
}

export function MiniSwitch({ checked, onChange, label, title, tone = 'primary', disabled }: MiniSwitchProps) {
  const activeClass = tone === 'success' ? 'bg-emerald-500' : 'bg-primary';

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none" title={title}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={classNames(
          'relative h-4 w-7 rounded-full transition-colors',
          checked ? activeClass : 'bg-muted-foreground/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span
          className={classNames(
            'absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-3',
          )}
        />
      </button>
      <span className="text-[0.7rem] font-medium text-muted-foreground">{label}</span>
    </label>
  );
}
