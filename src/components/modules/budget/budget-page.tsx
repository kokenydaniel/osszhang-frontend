'use client';

import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import {
  PageHeader,
  MetricStrip,
  Section,
  AccentPanel,
} from '@/components/design';
import { Bot, Check, Copy, Pencil, Plus, Tag, Wallet } from 'lucide-react';
import { useBudgetPageState } from '@/components/modules/budget/hooks/use-budget-page-state';
import { BudgetTransactionFeed } from '@/components/modules/budget/budget-transaction-feed';
import { BudgetTransactionModal } from '@/components/modules/budget/budget-transaction-modal';
import { BudgetLedgerModal } from '@/components/modules/budget/budget-ledger-modal';

export default function BudgetPage() {
  const state = useBudgetPageState();
  const { ConfirmDeleteModal } = state;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Költségvetés' }]}
        title="Cashflow"
        description="Bevételek, kiadások és tárgyhavi rezsi — egy nézetben."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              loading={state.cloning}
              onClick={() => void state.runClone(() => state.clonePreviousMonth(state.selectedMonth, state.selectedYear))}
            >
              {!state.cloning && <Copy size={13} />} {state.cloning ? 'Másolás…' : 'Múlt havi'}
            </Button>
            <Button size="sm" onClick={() => state.openTxForm(null)}>
              <Plus size={13} /> Új tétel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
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
              value={state.manualBalance}
              onChange={(e) => {
                state.setManualBalance(e.target.value);
                state.setBalanceSaved(false);
              }}
              onBlur={state.handleManualBalanceSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  state.handleManualBalanceSave();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              disabled={state.balanceSaving}
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
            {state.balanceSaving ? (
              <span>Mentés…</span>
            ) : state.balanceSaved ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <Check size={11} strokeWidth={2.5} /> Mentve
              </span>
            ) : null}
          </div>
        </motion.div>
        <MetricStrip items={state.cashflowMetrics} columns={3} variant="separated" />
      </div>

      {state.aiOverspend && (
        <AccentPanel
          tone={state.aiOverspend?.status === 'overspent' ? 'warning' : 'success'}
          icon={Bot}
          title={
            state.aiOverspend?.status === 'overspent' ? (
              <span>
                AI túlköltés érzékelve:{' '}
                {typeof state.aiOverspend?.overspend_amount === 'number' ? formatHUF(state.aiOverspend.overspend_amount) : ''}
              </span>
            ) : (
              'AI túlköltés ellenőrzés: rendben'
            )
          }
          description="Modell alapú elemzés a tárgyhavi költésekről"
          titleInfo={HELP.budget.aiOverspend}
        >
          {!!state.aiOverspend?.top_drivers?.length && (
            <div className="flex flex-wrap gap-1.5">
              {state.aiOverspend.top_drivers.map((d: { category: string; amount: number }) => (
                <span
                  key={d.category}
                  className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[0.7rem] shadow-sm"
                >
                  <Tag size={9} strokeWidth={2.2} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{d.category}:</span>
                  <span className="font-semibold tabular-nums text-foreground">{formatHUF(d.amount)}</span>
                </span>
              ))}
            </div>
          )}
        </AccentPanel>
      )}

      <div className="rounded-lg border border-border bg-card grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border overflow-hidden shadow-soft">
        {state.summaryMetrics.map((m) => (
          <div key={m.label} className="relative px-4 py-3.5 group hover:bg-muted/30 transition-colors">
            <span
              className={classNames(
                'absolute inset-y-0 left-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity',
                m.bar,
              )}
            />
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p
              className={classNames(
                'text-base lg:text-lg font-semibold tabular-nums mt-1 tracking-tight',
                m.tone || 'text-foreground',
              )}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Section title="Kategória összegzés" info={HELP.budget.categorySummary} description="Tárgyhavi kiadások">
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
            {state.categoryData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 px-4">Még nincs adat.</p>
            ) : (
              <>
                {state.categoryData.map((c, i) => {
                  const maxValue = Math.max(...state.categoryData.map((d) => d.value));
                  const progress = maxValue > 0 ? (c.value / maxValue) * 100 : 0;
                  return (
                    <div
                      key={c.name}
                      className={classNames('px-4 py-3 group hover:bg-muted/30 transition-colors', i > 0 && 'border-t border-border')}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {c.name}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-foreground">{formatHUF(c.value)}</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center px-4 py-3 border-t-2 border-border bg-muted/40">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-wider">Összesen</span>
                  <span className="text-sm font-semibold text-primary tabular-nums">{formatHUF(state.totalProjectedExpense)}</span>
                </div>
              </>
            )}
          </div>
        </Section>

        <div className="flex flex-col gap-7">
          <BudgetTransactionFeed {...state} items={state.incomes} title="Bevételek" type="income" />
          {state.reserves.length > 0 && (
            <BudgetTransactionFeed {...state} items={state.reserves} title="Tartalékok" type="expense" />
          )}
          <BudgetTransactionFeed {...state} items={state.expenses} title="Kiadások" type="expense" includeBills />
        </div>
      </div>

      <BudgetTransactionModal {...state} />
      <BudgetLedgerModal {...state} />
      <ConfirmDeleteModal />
    </div>
  );
}
