'use client';

import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Undo2, UserCheck } from 'lucide-react';

const settlementActionClass =
  'w-full lg:w-auto h-9 lg:h-8 min-h-9 lg:min-h-8 px-4 lg:px-3 gap-2 lg:gap-1.5 rounded-lg text-xs font-semibold shadow-sm justify-center lg:justify-start';

export function metricDebtHint(label: string, amount: number) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span>{label}</span>
      <span className="whitespace-nowrap font-medium tabular-nums text-foreground/75">{formatHUF(amount)}</span>
    </span>
  );
}

export function SettleDebtButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      loading={loading}
      onClick={onClick}
      className={classNames(
        settlementActionClass,
        'border-emerald-300/90 bg-gradient-to-b from-emerald-50 to-white text-emerald-800',
        'hover:border-emerald-400 hover:from-emerald-100/90 hover:to-emerald-50/50 hover:text-emerald-900',
        'active:scale-[0.98] shadow-emerald-500/10',
      )}
    >
      {!loading && <UserCheck size={14} strokeWidth={2.4} className="shrink-0 text-emerald-600" />}
      <span className="truncate">{loading ? 'Elszámolás…' : 'Tartozás rendezése'}</span>
      {!loading ? <ArrowRight size={12} strokeWidth={2.5} className="hidden lg:block shrink-0 opacity-70" /> : null}
    </Button>
  );
}

export function UnsettleDebtButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      loading={loading}
      onClick={onClick}
      className={classNames(
        settlementActionClass,
        'border-border/80 bg-background/90 text-muted-foreground font-medium',
        'hover:bg-muted/40 hover:text-foreground',
      )}
    >
      {!loading && <Undo2 size={12} strokeWidth={2.3} />}
      Visszavonás
    </Button>
  );
}
