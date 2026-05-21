'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF } from '@/utils';
import { computePayoff, computeAcceleration, formatPayoffDate } from '@/utils/debt';
import { Debt } from '@/types';
import { HELP } from '@/lib/helpTexts';
import { matchPaymentCategory, resolveDebtsSettings } from '@/lib/debtsSettings';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { CalendarDays, CreditCard, Target, TrendingDown } from 'lucide-react';
import type { MetricItem } from '@/components/design';

export type DebtStrategy = 'avalanche' | 'snowball';

export function useDebtsPageState() {
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

  const handleAiOptimize = async () => {
    setIsAiLoading(true);
    try {
      await fetchAiDebtPlan(strategy);
    } finally {
      setIsAiLoading(false);
    }
  };

  const orderedDebts = useMemo(() => {
    if (!aiDebtPlan?.schedule || aiDebtPlan.schedule.length === 0) return [] as typeof debtsWithPayoff;
    const byId = new Map(debtsWithPayoff.map((d) => [d.id, d]));
    return aiDebtPlan.schedule
      .map((s) => byId.get(s.debt_id))
      .filter((d): d is (typeof debtsWithPayoff)[number] => !!d);
  }, [aiDebtPlan, debtsWithPayoff]);

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

  return {
    isReader,
    debtsWithPayoff,
    totalDebt,
    monthlyMinimum,
    metrics,
    farthestPayoff,
    totalInterestRemaining,
    aiDebtPlan,
    strategy,
    setStrategy,
    isAiLoading,
    handleAiOptimize,
    orderedDebts,
    focusDebt,
    extraMonthly,
    setExtraMonthly,
    acceleration,
    openForm,
    openPayModal,
    deleteDebt,
    requestDelete,
    isModalOpen,
    setIsModalOpen,
    editId,
    name,
    setName,
    targetAmount,
    setTargetAmount,
    paidAmount,
    setPaidAmount,
    annualInterestRate,
    setAnnualInterestRate,
    minimumPayment,
    setMinimumPayment,
    dueDay,
    setDueDay,
    handleSubmit,
    isPayModalOpen,
    setIsPayModalOpen,
    payDebt,
    payAmount,
    setPayAmount,
    payDate,
    setPayDate,
    payNote,
    setPayNote,
    payAddToBudget,
    setPayAddToBudget,
    payCategory,
    setPayCategory,
    paySaving,
    handlePaySubmit,
    categories,
    selectedYear,
    selectedMonth,
    ConfirmDeleteModal,
  };
}

export type DebtsPageState = ReturnType<typeof useDebtsPageState>;
export type DebtWithPayoff = DebtsPageState['debtsWithPayoff'][number];
