'use client';

import classNames from 'classnames';

type ProgressBarTone = 'primary' | 'success' | 'danger' | 'thresholds' | 'gradient';

interface ProgressBarProps {
  value: number;
  max: number;
  size?: 'sm' | 'md';
  tone?: ProgressBarTone;
  barClassName?: string;
  barStyle?: React.CSSProperties;
  className?: string;
}

function resolveThresholdTone(progress: number): string {
  if (progress > 100) return 'bg-rose-500';
  if (progress > 90) return 'bg-amber-500';
  return 'bg-primary';
}

function resolveToneClass(tone: ProgressBarTone, progress: number): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-500';
    case 'danger':
      return 'bg-rose-500';
    case 'gradient':
      return 'bg-gradient-to-r from-primary to-violet-500';
    case 'thresholds':
      return resolveThresholdTone(progress);
    default:
      return 'bg-primary';
  }
}

export function ProgressBar({ value, max, size = 'sm', tone = 'primary', barClassName, barStyle, className }: ProgressBarProps) {
  const progress = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <span
      className={classNames(
        'block w-full bg-muted rounded-full overflow-hidden',
        size === 'sm' ? 'h-1' : 'h-1.5',
        className,
      )}
    >
      <span
        className={classNames(
          'block h-full rounded-full transition-all duration-500',
          barClassName ?? resolveToneClass(tone, progress),
        )}
        style={{ width: `${progress}%`, ...barStyle }}
      />
    </span>
  );
}
