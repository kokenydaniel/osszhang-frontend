import { useEffect, useMemo } from 'react';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { useDebtsUiStore } from '@/stores/useDebtsUiStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF } from '@/utils';
import { computePayoff, computeAcceleration, formatPayoffDate } from '@/utils/debt';
import { HELP } from '@/lib/helpTexts';
import { resolveDebtsSettings } from '@/lib/debtsSettings';
import { isHouseholdReader } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { CalendarDays, CreditCard, Target, TrendingDown } from 'lucide-react';
import type { MetricItem } from '@/components/design';

export type { DebtStrategy } from '@/stores/useDebtsUiStore';

export function useDebtsPageState() {
  const { debts, fetchDebts, deleteDebt, aiDebtPlan, loadedWalletId, isLoading: walletLoading } = useDebtsStore();
  const ui = useDebtsUiStore();
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { categories } = useBudgetStore();
  const { selectedYear, selectedMonth } = usePreferenceStore();
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const isReader = isHouseholdReader(user);
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  useEffect(() => {
    if (activeWalletId === null) return;
    if (loadedWalletId === activeWalletId && !walletLoading) return;
    void fetchDebts(activeWalletId);
  }, [activeWalletId, fetchDebts, loadedWalletId, walletLoading]);

  useEffect(() => {
    useDebtsUiStore.getState().syncPayCategory(categories);
  }, [categories]);

  useEffect(() => {
    useDebtsUiStore.getState().applyHouseholdDefaults();
  }, [debtsSettings]);

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

  const orderedDebts = useMemo(() => {
    if (!aiDebtPlan?.schedule || aiDebtPlan.schedule.length === 0) return [] as typeof debtsWithPayoff;
    const byId = new Map(debtsWithPayoff.map((d) => [d.id, d]));
    return aiDebtPlan.schedule
      .map((s) => byId.get(s.debt_id))
      .filter((d): d is (typeof debtsWithPayoff)[number] => !!d);
  }, [aiDebtPlan, debtsWithPayoff]);

  const focusDebt = orderedDebts[0];
  const acceleration = useMemo(() => {
    if (!focusDebt || ui.extraMonthly <= 0) return null;
    return computeAcceleration(
      focusDebt.remaining,
      focusDebt.annualInterestRate,
      focusDebt.minimumPayment,
      ui.extraMonthly,
    );
  }, [focusDebt, ui.extraMonthly]);

  return {
    isReader,
    debtsWithPayoff,
    totalDebt,
    monthlyMinimum,
    metrics,
    farthestPayoff,
    totalInterestRemaining,
    aiDebtPlan,
    strategy: ui.strategy,
    setStrategy: ui.setStrategy,
    isAiLoading: ui.isAiLoading,
    handleAiOptimize: ui.handleAiOptimize,
    orderedDebts,
    focusDebt,
    extraMonthly: ui.extraMonthly,
    setExtraMonthly: ui.setExtraMonthly,
    acceleration,
    openForm: ui.openForm,
    openPayModal: ui.openPayModal,
    deleteDebt,
    requestDelete,
    isModalOpen: ui.isModalOpen,
    setIsModalOpen: ui.setIsModalOpen,
    editId: ui.editId,
    name: ui.name,
    setName: ui.setName,
    targetAmount: ui.targetAmount,
    setTargetAmount: ui.setTargetAmount,
    paidAmount: ui.paidAmount,
    setPaidAmount: ui.setPaidAmount,
    annualInterestRate: ui.annualInterestRate,
    setAnnualInterestRate: ui.setAnnualInterestRate,
    minimumPayment: ui.minimumPayment,
    setMinimumPayment: ui.setMinimumPayment,
    dueDay: ui.dueDay,
    setDueDay: ui.setDueDay,
    handleSubmit: ui.handleSubmit,
    isPayModalOpen: ui.isPayModalOpen,
    setIsPayModalOpen: ui.setIsPayModalOpen,
    payDebt: ui.payDebt,
    payAmount: ui.payAmount,
    setPayAmount: ui.setPayAmount,
    payDate: ui.payDate,
    setPayDate: ui.setPayDate,
    payNote: ui.payNote,
    setPayNote: ui.setPayNote,
    payAddToBudget: ui.payAddToBudget,
    setPayAddToBudget: ui.setPayAddToBudget,
    payCategory: ui.payCategory,
    setPayCategory: ui.setPayCategory,
    paySaving: ui.paySaving,
    handlePaySubmit: ui.handlePaySubmit,
    categories,
    selectedYear,
    selectedMonth,
    ConfirmDeleteModal,
  };
}

export type DebtsPageState = ReturnType<typeof useDebtsPageState>;
export type DebtWithPayoff = DebtsPageState['debtsWithPayoff'][number];
