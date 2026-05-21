'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF } from '@/utils';
import { computePayoff, computeAcceleration, formatPayoffDate, formatTerm } from '@/utils/debt';
import { Debt } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
import { matchPaymentCategory, resolveDebtsSettings } from '@/lib/debtsSettings';
import { cn } from '@/lib/utils';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { motion } from 'motion/react';
import {
  PageHeader,
  MetricStrip,
  Section,
  EmptyState,
  StatusPill,
  DataTable,
  type MetricItem,
  type DataTableColumn,
} from '@/components/design';
import {
  Plus,
  Edit3,
  Trash2,
  TrendingDown,
  CreditCard,
  Banknote,
  Sparkles,
  RefreshCw,
  Calendar,
  Target,
  Cpu,
  Snowflake,
  Mountain,
  Info,
  CalendarDays,
  Coins,
  Wallet,
  AlertTriangle,
  Zap,
} from 'lucide-react';

type DebtStrategy = 'avalanche' | 'snowball';

export default function DebtsClient() {
  const { debts, fetchDebts, addDebt, deleteDebt, updateDebt, aiDebtPlan, fetchAiDebtPlan } = useDebtsStore();
  const { user } = useAuthStore();
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const { addTransaction, categories } = useBudgetStore();
  const { addNotification } = useNotificationStore();
  const { selectedYear, selectedMonth } = usePreferenceStore();
  const isReader = user?.role === 'reader';
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDay, setDueDay] = useState('');

  // Payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [payAddToBudget, setPayAddToBudget] = useState(debtsSettings.pay_add_to_budget_default);
  const [payCategory, setPayCategory] = useState(categories[0] || '');

  const [strategy, setStrategy] = useState<DebtStrategy>(debtsSettings.default_strategy);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [extraMonthly, setExtraMonthly] = useState<number>(debtsSettings.default_extra_monthly);
  const [paySaving, setPaySaving] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  useEffect(() => {
    if (categories.length > 0) {
      const def = matchPaymentCategory(categories, debtsSettings.payment_category_pattern);
      setPayCategory((current) => current || def);
    }
  }, [categories, debtsSettings.payment_category_pattern]);

  useEffect(() => {
    setStrategy(debtsSettings.default_strategy);
    setExtraMonthly(debtsSettings.default_extra_monthly);
    setPayAddToBudget(debtsSettings.pay_add_to_budget_default);
  }, [debtsSettings]);

  const openForm = (d?: Debt) => {
    if (d) {
      setEditId(d.id);
      setName(d.name);
      setTargetAmount(String(d.targetAmount));
      setPaidAmount(String(d.paidAmount));
      setAnnualInterestRate(d.annualInterestRate ? String(d.annualInterestRate) : '');
      setMinimumPayment(d.minimumPayment ? String(d.minimumPayment) : '');
      setDueDay(d.dueDay ? String(d.dueDay) : '');
    } else {
      setEditId(null);
      setName('');
      setTargetAmount('');
      setPaidAmount('0');
      setAnnualInterestRate('');
      setMinimumPayment('');
      setDueDay('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      targetAmount: Number(targetAmount),
      paidAmount: Number(paidAmount) || 0,
      annualInterestRate: annualInterestRate ? Number(annualInterestRate) : null,
      minimumPayment: minimumPayment ? Number(minimumPayment) : null,
      dueDay: dueDay ? Number(dueDay) : null,
      status: (Number(paidAmount) >= Number(targetAmount) ? 'Maradt' : 'Van még') as Debt['status'],
    };
    if (editId) updateDebt(editId, data);
    else addDebt(data);
    setIsModalOpen(false);
  };

  const openPayModal = (d: Debt) => {
    setPayDebt(d);
    setPayAmount(d.minimumPayment ? String(d.minimumPayment) : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNote(`${d.name} törlesztés`);
    setPayAddToBudget(debtsSettings.pay_add_to_budget_default);
    if (categories.length > 0) {
      setPayCategory(matchPaymentCategory(categories, debtsSettings.payment_category_pattern));
    }
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebt) return;
    const amt = Number(String(payAmount).replace(',', '.'));
    if (!(amt > 0)) {
      addNotification('Adj meg egy érvényes pozitív összeget.', 'error');
      return;
    }
    setPaySaving(true);
    try {
      const newPaid = Number(payDebt.paidAmount) + amt;
      const completed = newPaid >= Number(payDebt.targetAmount);
      await updateDebt(payDebt.id, {
        paidAmount: newPaid,
        status: (completed ? 'Maradt' : 'Van még') as Debt['status'],
      });
      if (payAddToBudget && payCategory) {
        await addTransaction({
          type: 'expense',
          description: payNote || `${payDebt.name} törlesztés`,
          category: payCategory,
          amount: amt,
          dueDate: payDate,
          paidDate: payDate,
          isBudget: false,
          isReserve: false,
        });
      }
      addNotification(
        `${formatHUF(amt)} törlesztés rögzítve${payAddToBudget ? ' (költségvetésben is)' : ''}.`,
        'success',
      );
      setIsPayModalOpen(false);
    } catch (err) {
      console.error(err);
      addNotification('Nem sikerült rögzíteni a törlesztést.', 'error');
    } finally {
      setPaySaving(false);
    }
  };

  // Per-debt amortization
  const debtsWithPayoff = useMemo(() => {
    return debts
      .map((d) => {
        const remaining = Math.max(0, Number(d.targetAmount) - Number(d.paidAmount));
        const payoff = computePayoff(remaining, d.annualInterestRate, d.minimumPayment);
        return { ...d, remaining, payoff };
      })
      .filter((d) => d.remaining > 0);
  }, [debts]);

  const totalDebt = debtsWithPayoff.reduce((s, d) => s + d.remaining, 0);
  const totalTarget = debts.reduce((s, d) => s + Number(d.targetAmount), 0);
  const totalPaid = debts.reduce((s, d) => s + Number(d.paidAmount), 0);
  const progressPercent = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
  const monthlyMinimum = debts.reduce((s, d) => s + (Number(d.minimumPayment) || 0), 0);

  // Furthest payoff (when ALL debts are done if you pay only minimums)
  const farthestPayoff = useMemo(() => {
    if (debtsWithPayoff.length === 0) return null;
    let maxDate = '';
    let underwaterCount = 0;
    for (const d of debtsWithPayoff) {
      if (d.payoff.isUnderwater) underwaterCount++;
      else if (d.payoff.payoffDate && d.payoff.payoffDate > maxDate) maxDate = d.payoff.payoffDate;
    }
    return { date: maxDate || null, underwaterCount };
  }, [debtsWithPayoff]);

  const totalInterestRemaining = debtsWithPayoff.reduce(
    (s, d) => s + (typeof d.payoff.totalInterest === 'number' ? d.payoff.totalInterest : 0),
    0,
  );

  const metrics: MetricItem[] = [
    {
      label: 'Hátralévő',
      value: formatHUF(totalDebt),
      info: HELP.debts.remaining,
      hint: `${debtsWithPayoff.length} aktív tartozás`,
      icon: TrendingDown,
      tone: totalDebt > 0 ? 'warning' : 'success',
      emphasis: true,
    },
    {
      label: 'Havi törlesztés',
      value: formatHUF(monthlyMinimum),
      info: HELP.debts.monthlyMin,
      hint: 'Összes havi minimum',
      icon: CreditCard,
      tone: 'primary',
    },
    {
      label: 'Becsült befejezés',
      value: farthestPayoff?.date ? formatPayoffDate(farthestPayoff.date) : '—',
      info: HELP.debts.payoffEstimate,
      hint:
        (farthestPayoff?.underwaterCount ?? 0) > 0
          ? `${farthestPayoff?.underwaterCount} hitelnél a havi nem fedi a kamatot`
          : 'Ha csak a minimumot fizeted',
      icon: CalendarDays,
      tone: (farthestPayoff?.underwaterCount ?? 0) > 0 ? 'danger' : 'info',
    },
    {
      label: 'Visszafizetve',
      value: `${progressPercent}%`,
      info: HELP.debts.progress,
      hint: `${formatHUF(totalPaid)} / ${formatHUF(totalTarget)}`,
      icon: Target,
      tone: progressPercent >= 75 ? 'success' : progressPercent >= 25 ? 'info' : 'default',
    },
  ];

  const handleAiOptimize = async () => {
    setIsAiLoading(true);
    try {
      await fetchAiDebtPlan(strategy);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Combine backend strategy order with frontend amortization
  const orderedDebts = useMemo(() => {
    if (!aiDebtPlan?.schedule || aiDebtPlan.schedule.length === 0) return [] as typeof debtsWithPayoff;
    const byId = new Map(debtsWithPayoff.map((d) => [d.id, d]));
    return aiDebtPlan.schedule
      .map((s) => byId.get(s.debt_id))
      .filter((d): d is (typeof debtsWithPayoff)[number] => !!d);
  }, [aiDebtPlan, debtsWithPayoff]);

  // Acceleration scenario on focus debt
  const focusDebt = orderedDebts[0];
  const acceleration = useMemo(() => {
    if (!focusDebt || extraMonthly <= 0) return null;
    return computeAcceleration(
      focusDebt.remaining,
      focusDebt.annualInterestRate,
      focusDebt.minimumPayment,
      extraMonthly,
    );
  }, [focusDebt, extraMonthly]);

  const columns: DataTableColumn<(typeof debtsWithPayoff)[number]>[] = [
    {
      key: 'name',
      header: 'Tartozás',
      width: '24%',
      cell: (d) => {
        const tone = d.payoff.isUnderwater ? 'bg-rose-100 text-rose-700' : 'bg-violet-100 text-violet-700';
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', tone)}>
              <CreditCard size={13} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-foreground truncate">{d.name}</div>
              <div className="text-[0.7rem] text-muted-foreground mt-0.5">
                {d.dueDay ? `Minden hó ${d.dueDay}. · ` : ''}Eredeti: {formatHUF(d.targetAmount)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'progress',
      header: 'Visszafizetve',
      width: '20%',
      cell: (d) => {
        const progress = d.targetAmount > 0 ? Math.min(100, (d.paidAmount / d.targetAmount) * 100) : 0;
        return (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-center">
              <span className="text-[0.7rem] text-muted-foreground tabular-nums truncate mr-2">
                {formatHUF(d.paidAmount)}
              </span>
              <span className="text-[0.7rem] font-semibold text-foreground tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
            <span className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <span
                className={cn(
                  'block h-full rounded-full transition-all',
                  progress >= 100
                    ? 'bg-emerald-500'
                    : progress >= 75
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : progress >= 25
                        ? 'bg-gradient-to-r from-primary to-violet-500'
                        : 'bg-gradient-to-r from-rose-400 to-orange-500',
                )}
                style={{ width: `${progress}%` }}
              />
            </span>
          </div>
        );
      },
    },
    {
      key: 'remaining',
      header: 'Hátralévő',
      align: 'right',
      width: '13%',
      cell: (d) => (
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            d.remaining <= 0 ? 'text-emerald-600' : 'text-foreground',
          )}
        >
          {formatHUF(d.remaining)}
        </span>
      ),
    },
    {
      key: 'minimum',
      header: 'Havi részlet',
      align: 'right',
      width: '12%',
      cell: (d) =>
        d.minimumPayment ? (
          <div className="flex flex-col items-end">
            <span className="text-sm text-foreground/85 tabular-nums">{formatHUF(d.minimumPayment)}</span>
            {d.annualInterestRate && (
              <span className="text-[0.65rem] text-muted-foreground tabular-nums">
                {d.annualInterestRate}% / év
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: 'payoff',
      header: 'Lejár',
      align: 'right',
      width: '16%',
      cell: (d) => {
        if (d.payoff.isUnderwater) {
          return (
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                <AlertTriangle size={11} strokeWidth={2.2} />
                Nincs vége
              </span>
              <span className="text-[0.65rem] text-muted-foreground">
                kell: {formatHUF(d.payoff.minimumViablePayment)}/hó
              </span>
            </div>
          );
        }
        if (!d.payoff.months) {
          return <span className="text-xs text-muted-foreground/60">—</span>;
        }
        return (
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatPayoffDate(d.payoff.payoffDate)}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">{formatTerm(d.payoff.months)}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '15%',
      cell: (d) =>
        !isReader ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="xs"
              className="text-emerald-700 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300"
              onClick={() => openPayModal(d)}
            >
              <Banknote size={12} /> Befizetés
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => openForm(d)}
            >
              <Edit3 size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                requestDelete({
                  title: 'Tartozás törlése',
                  message: `Biztosan törlöd a „${d.name}" tartozást? Ez a művelet nem vonható vissza.`,
                  onConfirm: () => deleteDebt(d.id),
                })
              }
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Tartozások' }]}
        title="Tartozások"
        description="Hitelek, kölcsönök — pontos lejárattal és költségvetés-integrációval."
        actions={
          !isReader ? (
            <Button size="sm" onClick={() => openForm()}>
              <Plus size={13} /> Új tartozás
            </Button>
          ) : undefined
        }
      />

      <MetricStrip items={metrics} columns={4} variant="separated" />

      {/* Hint about integration */}
      {debtsWithPayoff.length > 0 && (
        <div className="rounded-lg border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card px-4 py-3 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Info size={14} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Hogyan használd?
            </p>
            <p className="text-[0.78rem] text-muted-foreground mt-0.5 leading-relaxed">
              A „Lejár" oszlop a havi részlet és a kamat alapján mutatja, mikor fut ki a hitel. A „Befizetés"
              gombbal egyszerre tudod csökkenteni a tartozást, és a havi törlesztést rögzíteni a költségvetésbe is.
            </p>
          </div>
        </div>
      )}

      {debtsWithPayoff.length > 0 && (
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
              <RefreshCw size={12} className={cn(isAiLoading && 'animate-spin')} />
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
                  className={cn(
                    'group relative overflow-hidden rounded-lg border p-4 text-left transition-all',
                    active
                      ? 'border-primary/40 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-glow'
                      : 'border-border bg-card hover:border-foreground/20 hover:shadow-soft',
                  )}
                >
                  {active && <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-primary" />}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
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
                      className={cn(
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

              {/* Acceleration scenario */}
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
                        className={cn(
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
      )}

      <Section
        title={`Aktív tartozások · ${debtsWithPayoff.length}`}
        description={
          debtsWithPayoff.length > 0
            ? `Összesen ${formatHUF(totalDebt)} van hátra · havi ${formatHUF(monthlyMinimum)} törlesztés`
            : 'Még nincs rögzítve tartozás'
        }
      >
        {debtsWithPayoff.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nincs aktív tartozás"
            description={
              isReader
                ? 'Még nincs rögzítve tartozás.'
                : 'Adj hozzá egy hitelt vagy kölcsönt a jobb felső sarokban lévő „Új tartozás” gombbal.'
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={debtsWithPayoff.slice().sort((a, b) => b.remaining - a.remaining)}
            rowKey={(d) => d.id}
            minWidth="900px"
          />
        )}
      </Section>

      {/* ADD/EDIT debt modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Tartozás szerkesztése' : 'Új tartozás'}
        description="Add meg az aktuális hátralékot, kamatot és a havi részletet. Ezek alapján számítjuk a lejáratot."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.debts.name}>Megnevezés</FieldLabel>
            <Input
              placeholder="pl. Lakáshitel, Autóhitel, Hitelkártya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.debts.targetAmount}>Eredeti összeg (Ft)</FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.debts.paidAmount}>Eddig törlesztve (Ft)</FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <FormField
              label="Éves kamat (%)"
              info={HELP.debts.interestRate}
              hint="A lejárat számításához kell — THM-hez közeli érték."
            >
              <Input
                type="number"
                step="0.01"
                placeholder="pl. 7.5"
                value={annualInterestRate}
                onChange={(e) => setAnnualInterestRate(e.target.value)}
              />
            </FormField>
            <FormField
              label="Havi részlet (Ft)"
              info={HELP.debts.minimumPayment}
              hint="A bank által előírt havi törlesztő — ha kisebb a kamatnál, a tartozás nem csökken."
            >
              <Input
                type="number"
                placeholder="0"
                value={minimumPayment}
                onChange={(e) => setMinimumPayment(e.target.value)}
              />
            </FormField>
            <FormField label="Esedékesség napja" info={HELP.debts.dueDay}>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="1-31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </FormField>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Mégse
            </Button>
            <Button type="submit" className="flex-1">
              {editId ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* PAYMENT modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Törlesztés rögzítése"
        description={
          payDebt
            ? `${payDebt.name} · ${formatHUF(Math.max(0, Number(payDebt.targetAmount) - Number(payDebt.paidAmount)))} van hátra`
            : ''
        }
      >
        <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.debts.payAmount}>Összeg (Ft)</FieldLabel>
              <Input
                type="number"
                step="any"
                placeholder="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
              {payDebt?.minimumPayment && Number(payAmount) > 0 && Number(payAmount) !== Number(payDebt.minimumPayment) && (
                <p className="text-[0.7rem] text-muted-foreground">
                  Eltér a havi részlettől ({formatHUF(payDebt.minimumPayment)})
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.debts.payDate}>Dátum</FieldLabel>
              <DatePicker value={payDate} onChange={setPayDate} />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel info={HELP.debts.payNote}>Megjegyzés</FieldLabel>
            <Input
              placeholder="pl. Júniusi részlet"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
            />
          </div>

          <div className="rounded-md border border-border bg-gradient-to-br from-primary/[0.04] to-card p-3.5 space-y-3">
            <p className="text-[0.72rem] text-muted-foreground leading-snug">
              {HELP.debts.payBudget}
            </p>
            <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={payAddToBudget}
                onChange={(e) => setPayAddToBudget(e.target.checked)}
              />
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={14} className="text-primary" />
                <span className="font-medium">Költségvetésbe is rögzítem</span>
                <InfoTooltip content={HELP.debts.payBudget} />
              </span>
            </label>
            {payAddToBudget && (
              <div className="space-y-1.5 pl-7">
                <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.debts.payCategory}>
                  Kategória
                </FieldLabel>
                {categories.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                    Még nincs kategória. Hozz létre egyet a Beállításokban.
                  </p>
                ) : (
                  <select
                    className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                    value={payCategory}
                    onChange={(e) => setPayCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[0.7rem] text-muted-foreground">
                  Egy „kifizetve" státuszú kiadás-tételt rögzít a {selectedYear}.{' '}
                  {String(selectedMonth).padStart(2, '0')}. hónapra.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsPayModalOpen(false)}
              disabled={paySaving}
            >
              Mégse
            </Button>
            <Button type="submit" className="flex-1" disabled={paySaving}>
              {paySaving ? <RefreshCw size={13} className="animate-spin" /> : <Banknote size={13} />}
              Befizetés rögzítése
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal />
    </div>
  );
}
