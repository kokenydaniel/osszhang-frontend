'use client';

import classNames from 'classnames';
import { History, Lock, MapPinned, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MiniSwitch, metricLabelClassName } from '@/components/design';
import { formatHUF } from '@/utils';
import { savingsCalculations } from '@/calculations/savings';
import { SAVINGS_INCLUDE_IN_SUMMARY_SWITCH } from './savings-ui';
import type { SavingsAccount } from '@/types';

type SavingsGoalCardProps = {
  goal: SavingsAccount;
  updateSavingsAccount: (id: number, partial: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => Promise<void>;
  deleteSavingsAccount: (id: number) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
  onOpenLedger: (accId: number) => void;
  isReader: boolean;
  selectedMonth: number;
  selectedYear: number;
};

function WalletBadge({ isShared, name }: { isShared: boolean; name: string }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
        isShared
          ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400'
          : 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400',
      )}
    >
      {isShared ? <Users size={11} /> : <Lock size={11} />}
      {isShared ? 'Közös' : 'Privát'}
      <span className="opacity-60 font-normal normal-case tracking-normal">· {name}</span>
    </span>
  );
}

export function SavingsGoalCard({
  goal,
  updateSavingsAccount,
  deleteSavingsAccount,
  requestDelete,
  onOpenLedger,
  isReader,
  selectedMonth,
  selectedYear,
}: SavingsGoalCardProps) {
  const saved = savingsCalculations.computeBalance(goal);
  const progress = savingsCalculations.goalProgress(saved, goal.goalAmount);
  const remaining = savingsCalculations.goalRemaining(saved, goal.goalAmount);
  const monthlyHint = savingsCalculations.goalMonthlyHint(
    goal.ledger,
    goal.goalAmount,
    goal.targetDate,
    formatHUF,
    selectedYear,
    selectedMonth,
  );
  const walletIsShared = goal.wallet?.isShared ?? goal.wallet?.is_shared ?? true;
  const walletName = goal.wallet?.name ?? 'Kassza';

  return (
    <article className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <h3 className="text-base font-semibold text-foreground tracking-tight truncate">{goal.institution}</h3>
          {(goal.travelPlanId ?? goal.travel_plan_id) ? (
            <Link
              href="/tools/travel"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <MapPinned size={12} /> Utazási terv
            </Link>
          ) : null}
          <WalletBadge isShared={walletIsShared} name={walletName} />
        </div>
        {!isReader && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() =>
              requestDelete({
                title: 'Cél törlése',
                message: `Biztosan törlöd a „${goal.institution}" megtakarítási célt és az összes mozgást?`,
                onConfirm: () => deleteSavingsAccount(goal.id),
              })
            }
          >
            Törlés
          </Button>
        )}
      </div>

      <div>
        <span className={metricLabelClassName()}>
          Aktuális összeg
        </span>
        <div className="flex items-end justify-between gap-3 mt-1">
          <p className="text-2xl font-semibold text-primary tabular-nums tracking-tight leading-none">
            {formatHUF(saved)}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums pb-0.5">
            / {formatHUF(goal.goalAmount)} · {Math.round(progress)}%
          </p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted mt-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground">
          Hátralévő: <span className="font-medium text-foreground tabular-nums">{formatHUF(remaining)}</span>
        </p>
        {monthlyHint && <p className="text-foreground/90 leading-relaxed">{monthlyHint}</p>}
        {goal.targetDate && !monthlyHint && (
          <p className="text-muted-foreground">Határidő: {savingsCalculations.formatGoalDeadline(goal.targetDate)}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <MiniSwitch
          checked={goal.count_in_savings !== false}
          onChange={(checked) => void updateSavingsAccount(goal.id, { count_in_savings: checked })}
          label={SAVINGS_INCLUDE_IN_SUMMARY_SWITCH.label}
          title={SAVINGS_INCLUDE_IN_SUMMARY_SWITCH.title}
          disabled={isReader}
        />
        <Button type="button" variant="ghost" size="xs" onClick={() => onOpenLedger(goal.id)}>
          <History size={12} /> Mozgások
        </Button>
      </div>
    </article>
  );
}
