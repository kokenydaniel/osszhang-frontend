'use client';

import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { formatPayoffDate, formatTerm } from '@/utils/debt';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
import { Section, StatusPill } from '@/components/design';
import { motion } from 'motion/react';
import {
  RefreshCw,
  Mountain,
  Snowflake,
  Info,
  Cpu,
  CalendarDays,
  Coins,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { DebtsPageState } from '@/components/modules/debts/hooks/use-debts-page-state';

type DebtsStrategySectionProps = Pick<
  DebtsPageState,
  | 'strategy'
  | 'setStrategy'
  | 'isAiLoading'
  | 'handleAiOptimize'
  | 'aiDebtPlan'
  | 'orderedDebts'
  | 'farthestPayoff'
  | 'totalInterestRemaining'
  | 'focusDebt'
  | 'extraMonthly'
  | 'setExtraMonthly'
  | 'acceleration'
>;

export function DebtsStrategySection({
  strategy,
  setStrategy,
  isAiLoading,
  handleAiOptimize,
  aiDebtPlan,
  orderedDebts,
  farthestPayoff,
  totalInterestRemaining,
  focusDebt,
  extraMonthly,
  setExtraMonthly,
  acceleration,
}: DebtsStrategySectionProps) {
  return (
    <Section
      title="Visszafizetési stratégia"
      info={HELP.debts.strategy}
      description="Két matematikai módszer közül választhatsz — a stratégia rendezi a tartozásokat, hogy mire fókuszálj."
      action={
        <Button
          variant={aiDebtPlan ? 'outline' : 'default'}
          size="sm"
          onClick={handleAiOptimize}
          disabled={isAiLoading}
        >
          <RefreshCw size={12} className={classNames(isAiLoading && 'animate-spin')} />
          {isAiLoading ? 'Számítás…' : aiDebtPlan ? 'Újraszámítás' : 'Sorrend generálása'}
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {(
          [
            {
              id: 'avalanche' as const,
              label: 'Avalanche (lavina)',
              subtitle: 'Legmagasabb kamatú elsőként',
              description:
                'A legnagyobb éves kamatú tartozást támadod először. Matematikailag a legkevesebb teljes kamatot fizeted.',
              icon: Mountain,
              gradient: 'from-rose-500 to-orange-500',
              bestFor: 'Ha a teljes költséget akarod minimalizálni.',
            },
            {
              id: 'snowball' as const,
              label: 'Snowball (hólabda)',
              subtitle: 'Legkisebb összeg elsőként',
              description:
                'A legkisebb hátralékot zárod le először. Gyors sikerélmény, motiváló lendület.',
              icon: Snowflake,
              gradient: 'from-sky-500 to-cyan-500',
              bestFor: 'Ha pszichológiai lendület kell.',
            },
          ] as const
        ).map((opt) => {
          const Icon = opt.icon;
          const active = strategy === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStrategy(opt.id)}
              className={classNames(
                'group relative overflow-hidden rounded-lg border p-4 text-left transition-all',
                active
                  ? 'border-primary/40 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-glow'
                  : 'border-border bg-card hover:border-foreground/20 hover:shadow-soft',
              )}
            >
              {active && <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-primary" />}
              <div className="flex items-start gap-3">
                <div
                  className={classNames(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white shadow-sm',
                    opt.gradient,
                  )}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    {active && (
                      <StatusPill status="primary" size="xs">aktív</StatusPill>
                    )}
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground font-medium mt-0.5">{opt.subtitle}</p>
                  <p className="mt-2 text-xs text-muted-foreground/90 leading-relaxed">{opt.description}</p>
                  <p className="mt-2 text-[0.7rem] text-foreground/70 italic inline-flex items-start gap-1">
                    <Info size={10} className="mt-0.5 shrink-0" />
                    {opt.bestFor}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!aiDebtPlan || orderedDebts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-card border border-border text-muted-foreground mb-3">
            <Cpu size={18} strokeWidth={1.8} />
          </div>
          <p className="text-sm font-medium text-foreground">
            Válassz stratégiát, majd kattints a „Sorrend generálása" gombra
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Megkapod, melyik tartozásra koncentrálj, és kiszámítjuk, mennyit nyerhetsz, ha kicsivel többet
            fizetsz a fókusz hitelre.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border bg-gradient-to-br from-primary/[0.04] via-card to-card">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 text-white shadow-sm">
                {aiDebtPlan.strategy === 'avalanche' ? (
                  <Mountain size={14} strokeWidth={2.2} />
                ) : (
                  <Snowflake size={14} strokeWidth={2.2} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Stratégia</p>
                <p className="text-sm font-semibold text-foreground">
                  {aiDebtPlan.strategy === 'avalanche' ? 'Avalanche' : 'Snowball'}
                </p>
              </div>
            </div>
            {farthestPayoff?.date && (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
                  <CalendarDays size={14} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                    Utolsó hitel lejárta
                  </p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {formatPayoffDate(farthestPayoff.date)}
                  </p>
                </div>
              </div>
            )}
            {totalInterestRemaining > 0 && (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                  <Coins size={14} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                    Hátralévő kamat (jelenlegi minimumon)
                  </p>
                  <p className="text-sm font-semibold text-amber-700 tabular-nums">
                    {formatHUF(totalInterestRemaining)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border">
            <div className="grid grid-cols-[40px_1fr_140px] sm:grid-cols-[48px_1fr_140px_180px_180px] gap-3 px-4 py-2.5 bg-muted/30 border-b border-border">
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">#</span>
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Tartozás</span>
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground text-right">Hátralévő</span>
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground text-right hidden sm:block">Havi részlet</span>
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground text-right hidden sm:block">Lejár</span>
            </div>
            {orderedDebts.map((d, idx) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="grid grid-cols-[40px_1fr_140px] sm:grid-cols-[48px_1fr_140px_180px_180px] gap-3 px-4 py-3 items-center group hover:bg-muted/30 transition-colors border-b border-border last:border-b-0"
              >
                <div
                  className={classNames(
                    'flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold shadow-sm',
                    idx === 0
                      ? 'bg-gradient-to-br from-primary to-violet-500 text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                  {idx === 0 && (
                    <span className="text-[0.65rem] font-medium uppercase tracking-wider text-primary inline-flex items-center gap-1 mt-0.5">
                      <Zap size={9} strokeWidth={2.4} /> ide tedd a plusz pénzt
                    </span>
                  )}
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-sm font-semibold text-foreground">{formatHUF(d.remaining)}</span>
                </div>
                <div className="text-right tabular-nums hidden sm:block">
                  <span className="text-sm font-medium text-foreground">
                    {d.minimumPayment ? formatHUF(d.minimumPayment) : '—'}
                  </span>
                  {d.annualInterestRate && (
                    <div className="text-[0.65rem] text-muted-foreground">{d.annualInterestRate}% / év</div>
                  )}
                </div>
                <div className="text-right tabular-nums hidden sm:block">
                  {d.payoff.isUnderwater ? (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertTriangle size={11} /> nincs vége
                    </span>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-foreground">
                        {formatPayoffDate(d.payoff.payoffDate)}
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground">{formatTerm(d.payoff.months)}</div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {focusDebt && !focusDebt.payoff.isUnderwater && (
            <div className="border-t border-border bg-gradient-to-br from-primary/[0.04] via-card to-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-primary" strokeWidth={2.2} />
                <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                  Mit nyersz, ha többet fizetsz a fókusz hitelre?
                  <InfoTooltip content={HELP.debts.extraPayment} />
                </p>
              </div>
              <p className="text-[0.78rem] text-muted-foreground mb-3 leading-relaxed">
                A „{focusDebt.name}" hitelre extra havi befizetés. A többi hitelnél a minimum marad.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[10000, 25000, 50000, 100000, 250000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setExtraMonthly((cur) => (cur === amt ? 0 : amt))}
                    className={classNames(
                      'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors',
                      extraMonthly === amt
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-foreground/20',
                    )}
                  >
                    +{formatHUF(amt)}/hó
                  </button>
                ))}
              </div>
              {acceleration ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-md border border-border bg-card px-3 py-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Új lejárat</p>
                    <p className="text-base font-semibold text-foreground tabular-nums mt-0.5">
                      {formatPayoffDate(acceleration.newPayoffDate)}
                    </p>
                    <p className="text-[0.7rem] text-muted-foreground">{formatTerm(acceleration.newTotalMonths)}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-emerald-700">Megspórolt idő</p>
                    <p className="text-base font-semibold text-emerald-700 tabular-nums mt-0.5">
                      {formatTerm(acceleration.monthsSaved)}
                    </p>
                    <p className="text-[0.7rem] text-emerald-700/80">
                      ennyivel hamarabb fizeted le
                    </p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-emerald-700">Megspórolt kamat</p>
                    <p className="text-base font-semibold text-emerald-700 tabular-nums mt-0.5">
                      {formatHUF(acceleration.interestSaved)}
                    </p>
                    <p className="text-[0.7rem] text-emerald-700/80">teljes futamidőre</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Válassz egy extra összeget, hogy lásd a hatást.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
