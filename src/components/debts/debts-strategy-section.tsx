'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { debtsCalculations, type DebtWithPayoff } from '@/calculations/debts';
import { aiHelpers } from '@/helpers/ai-helpers';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/config/help';
import { Section, ChoiceCardGroup, type ChoiceCardOption, metricLabelClassName } from '@/components/design';
import { motion } from 'motion/react';
import {
  RefreshCw,
  Mountain,
  Snowflake,
  Cpu,
  CalendarDays,
  Coins,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { AiDebtPlan } from '@/types';
import type { DebtStrategy, DebtsSettings } from '@/settings/debts';
import { useNotificationStore } from '@/stores/useNotificationStore';

type DebtsStrategySectionProps = {
  walletId: number | null;
  debtsSettings: DebtsSettings;
  debtsWithPayoff: DebtWithPayoff[];
  aiDebtPlan: AiDebtPlan | null;
  onAiPlanChange: (plan: AiDebtPlan | null) => void;
  farthestPayoff: { date: string | null; underwaterCount: number } | null;
  totalInterestRemaining: number;
};

export function DebtsStrategySection({
  walletId,
  debtsSettings,
  debtsWithPayoff,
  aiDebtPlan,
  onAiPlanChange,
  farthestPayoff,
  totalInterestRemaining,
}: DebtsStrategySectionProps) {
  const { addNotification } = useNotificationStore();
  const [strategy, setStrategy] = useState<DebtStrategy>(debtsSettings.default_strategy);
  const [extraMonthly, setExtraMonthly] = useState(debtsSettings.default_extra_monthly);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setStrategy(debtsSettings.default_strategy);
    setExtraMonthly(debtsSettings.default_extra_monthly);
  }, [
    debtsSettings.default_extra_monthly,
    debtsSettings.default_strategy,
  ]);

  const orderedDebts = useMemo(
    () => debtsCalculations.orderByAiSchedule(debtsWithPayoff, aiDebtPlan),
    [aiDebtPlan, debtsWithPayoff],
  );

  const focusDebt = orderedDebts[0];

  const acceleration = useMemo(() => {
    if (!focusDebt || extraMonthly <= 0) return null;
    return debtsCalculations.computeAcceleration(
      focusDebt.remaining,
      focusDebt.annualInterestRate,
      focusDebt.minimumPayment,
      extraMonthly,
    );
  }, [extraMonthly, focusDebt]);

  const requestAiOptimize = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const plan = await aiHelpers.getDebtOptimizationPlan(strategy, walletId);
      if (plan) {
        onAiPlanChange(plan);
      } else {
        addNotification('Az AI sorrend generálása nem sikerült.', 'error');
      }
    } finally {
      setIsAiLoading(false);
    }
  }, [addNotification, onAiPlanChange, strategy, walletId]);

  const strategyOptions: ChoiceCardOption[] = [
    {
      id: 'avalanche',
      label: 'Avalanche (lavina)',
      subtitle: 'Legmagasabb kamatú elsőként',
      description:
        'A legnagyobb éves kamatú tartozást támadod először. Matematikailag a legkevesebb teljes kamatot fizeted.',
      icon: Mountain,
      gradient: 'from-rose-500 to-orange-500',
      bestFor: 'Ha a teljes költséget akarod minimalizálni.',
    },
    {
      id: 'snowball',
      label: 'Snowball (hólabda)',
      subtitle: 'Legkisebb összeg elsőként',
      description:
        'A legkisebb hátralékot zárod le először. Gyors sikerélmény, motiváló lendület.',
      icon: Snowflake,
      gradient: 'from-sky-500 to-cyan-500',
      bestFor: 'Ha pszichológiai lendület kell.',
    },
  ];

  return (
    <Section
      title="Visszafizetési stratégia"
      info={HELP.debts.strategy}
      description="Két matematikai módszer közül választhatsz — a stratégia rendezi a tartozásokat, hogy mire fókuszálj."
      action={
        <TierGatedButton
          feature="ai"
          featureLabel="Tartozás-visszafizetési sorrend"
          variant={aiDebtPlan ? 'outline' : 'default'}
          size="sm"
          onClick={requestAiOptimize}
          disabled={isAiLoading}
        >
          <RefreshCw size={12} className={classNames(isAiLoading && 'animate-spin')} />
          {isAiLoading ? 'Számítás…' : aiDebtPlan ? 'Újraszámítás' : 'Sorrend generálása'}
        </TierGatedButton>
      }
    >
      <ChoiceCardGroup
        value={strategy}
        onChange={(v) => setStrategy(v as DebtStrategy)}
        options={strategyOptions}
        className="mb-4"
      />

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
                <p className={metricLabelClassName()}>Stratégia</p>
                <p className="text-sm font-semibold text-foreground">
                  {aiDebtPlan.strategy === 'avalanche' ? 'Avalanche' : 'Snowball'}
                </p>
              </div>
            </div>
            {farthestPayoff?.date ? (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
                  <CalendarDays size={14} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className={metricLabelClassName()}>
                    Utolsó hitel lejárta
                  </p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {debtsCalculations.formatPayoffDate(farthestPayoff.date)}
                  </p>
                </div>
              </div>
            ) : null}
            {totalInterestRemaining > 0 ? (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                  <Coins size={14} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className={metricLabelClassName()}>
                    Hátralévő kamat (jelenlegi minimumon)
                  </p>
                  <p className="text-sm font-semibold text-amber-700 tabular-nums">
                    {formatHUF(totalInterestRemaining)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-border">
            <div className="grid grid-cols-[40px_1fr_140px] sm:grid-cols-[48px_1fr_140px_180px_180px] gap-3 px-4 py-2.5 bg-muted/30 border-b border-border">
              <span className={metricLabelClassName()}>#</span>
              <span className={metricLabelClassName()}>Tartozás</span>
              <span className={metricLabelClassName('text-right')}>Hátralévő</span>
              <span className={metricLabelClassName('text-right', 'hidden', 'sm:block')}>Havi részlet</span>
              <span className={metricLabelClassName('text-right', 'hidden', 'sm:block')}>Lejár</span>
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
                  {idx === 0 ? (
                    <span className={metricLabelClassName('text-primary', 'inline-flex', 'items-center', 'gap-1', 'mt-0.5')}>
                      <Zap size={9} strokeWidth={2.4} /> ide tedd a plusz pénzt
                    </span>
                  ) : null}
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-sm font-semibold text-foreground">{formatHUF(d.remaining)}</span>
                </div>
                <div className="text-right tabular-nums hidden sm:block">
                  <span className="text-sm font-medium text-foreground">
                    {d.minimumPayment ? formatHUF(d.minimumPayment) : '—'}
                  </span>
                  {d.annualInterestRate ? (
                    <div className="text-[0.65rem] text-muted-foreground">{d.annualInterestRate}% / év</div>
                  ) : null}
                </div>
                <div className="text-right tabular-nums hidden sm:block">
                  {d.payoff.isUnderwater ? (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertTriangle size={11} /> nincs vége
                    </span>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-foreground">
                        {debtsCalculations.formatPayoffDate(d.payoff.payoffDate)}
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground">{debtsCalculations.formatTerm(d.payoff.months)}</div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {focusDebt && !focusDebt.payoff.isUnderwater ? (
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
                    <p className={metricLabelClassName()}>Új lejárat</p>
                    <p className="text-base font-semibold text-foreground tabular-nums mt-0.5">
                      {debtsCalculations.formatPayoffDate(acceleration.newPayoffDate)}
                    </p>
                    <p className="text-[0.7rem] text-muted-foreground">{debtsCalculations.formatTerm(acceleration.newTotalMonths)}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                    <p className={metricLabelClassName('text-emerald-700')}>Megspórolt idő</p>
                    <p className="text-base font-semibold text-emerald-700 tabular-nums mt-0.5">
                      {debtsCalculations.formatTerm(acceleration.monthsSaved)}
                    </p>
                    <p className="text-[0.7rem] text-emerald-700/80">ennyivel hamarabb fizeted le</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                    <p className={metricLabelClassName('text-emerald-700')}>Megspórolt kamat</p>
                    <p className="text-base font-semibold text-emerald-700 tabular-nums mt-0.5">
                      {formatHUF(acceleration.interestSaved)}
                    </p>
                    <p className="text-[0.7rem] text-emerald-700/80">teljes futamidőre</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Válassz egy extra összeget, hogy lásd a hatást.</p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}
