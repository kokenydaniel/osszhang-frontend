'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Check, Lock, Pencil, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HELP } from '@/config/help';
import classNames from 'classnames';

type BudgetBalancePanelProps = {
  manualBalance: string;
  onManualBalanceChange: (value: string) => void;
  balanceSaving: boolean;
  balanceSaved: boolean;
  onSave: () => void;
  isReader: boolean;
};

export function BudgetBalancePanel({
  manualBalance,
  onManualBalanceChange,
  balanceSaving,
  balanceSaved,
  onSave,
  isReader,
}: BudgetBalancePanelProps) {
  const readOnly = isReader;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { y: 4 }}
      animate={reduceMotion ? undefined : { y: 0 }}
      transition={{ duration: 0.3 }}
      className={classNames(
        'relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-glow',
        readOnly && 'opacity-90',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-primary" />
      <FieldLabel info={HELP.budget.manualBalance} className="text-primary">
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider">
          <Wallet size={11} /> Aktuális egyenleg
          {readOnly ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex items-center text-muted-foreground"
                  aria-label="Olvasó jogosultság – szerkesztés nem engedélyezett"
                >
                  <Lock size={11} strokeWidth={2.2} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-center">
                Olvasó jogosultság: az egyenleg csak megtekinthető, módosítás nem engedélyezett.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </span>
      </FieldLabel>
      <div className="relative mt-3">
        <Input
          type="number"
          inputMode="numeric"
          value={manualBalance}
          onChange={(e) => {
            if (readOnly) return;
            onManualBalanceChange(e.target.value);
          }}
          onBlur={() => {
            if (!readOnly) onSave();
          }}
          onKeyDown={(e) => {
            if (readOnly) return;
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave();
              (e.target as HTMLInputElement).blur();
            }
          }}
          disabled={balanceSaving || readOnly}
          readOnly={readOnly}
          className={classNames(
            'h-12 pr-14 text-2xl font-bold tabular-nums bg-card/80 border-primary/20 focus-visible:ring-primary/30',
            readOnly && 'cursor-not-allowed opacity-50',
          )}
          placeholder="0"
          aria-label="Aktuális egyenleg forintban"
          aria-readonly={readOnly}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          Ft
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {readOnly ? (
            <>
              <Lock size={11} strokeWidth={2.2} />
              Csak megtekintés
            </>
          ) : (
            <>
              <Pencil size={11} strokeWidth={2.2} />
              Bankszámla / készpénz
            </>
          )}
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
