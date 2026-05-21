'use client';

import { motion } from 'motion/react';
import { Check, Pencil, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import type { BudgetPageState } from '@/components/modules/budget/hooks/use-budget-page-state';

type BudgetBalancePanelProps = Pick<
  BudgetPageState,
  | 'manualBalance'
  | 'setManualBalance'
  | 'setBalanceSaved'
  | 'balanceSaving'
  | 'balanceSaved'
  | 'handleManualBalanceSave'
>;

export function BudgetBalancePanel({
  manualBalance,
  setManualBalance,
  setBalanceSaved,
  balanceSaving,
  balanceSaved,
  handleManualBalanceSave,
}: BudgetBalancePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-glow"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-primary" />
      <FieldLabel info={HELP.budget.manualBalance} className="text-primary">
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider">
          <Wallet size={11} /> Aktuális egyenleg
        </span>
      </FieldLabel>
      <div className="relative mt-3">
        <Input
          type="number"
          inputMode="numeric"
          value={manualBalance}
          onChange={(e) => {
            setManualBalance(e.target.value);
            setBalanceSaved(false);
          }}
          onBlur={handleManualBalanceSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleManualBalanceSave();
              (e.target as HTMLInputElement).blur();
            }
          }}
          disabled={balanceSaving}
          className="h-12 pr-14 text-2xl font-bold tabular-nums bg-card/80 border-primary/20 focus-visible:ring-primary/30"
          placeholder="0"
          aria-label="Aktuális egyenleg forintban"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          Ft
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Pencil size={11} strokeWidth={2.2} />
          Bankszámla / készpénz
        </span>
        {balanceSaving ? (
          <span>Mentés…</span>
        ) : balanceSaved ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <Check size={11} strokeWidth={2.5} /> Mentve
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
