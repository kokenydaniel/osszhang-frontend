'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useMetersStore } from '@/stores/useMetersStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF } from '@/utils';
import { isLegacySettlementBill } from '@/lib/utilityBills';
import { computeUtilityNetBalance } from '@/lib/utilityBalance';
import { ourUtilityPortion, resolveUtilitySplitLabels } from '@/lib/utilityViewer';
import { LedgerEntry } from '@/types';
import { HELP } from '@/lib/helpTexts';
import { canAccessModule } from '@/lib/moduleAccess';
import type { MetricItem } from '@/components/design';
import {
  Wallet,
  TrendingUp,
  Users,
  AlertCircle,
  TrendingDown,
  ReceiptText,
  PiggyBank,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';

export type Investment = {
  id: number;
  name: string;
  owner: string;
  principalAmount: number;
  currentValue?: number | null;
  annualInterestRate: number;
  purchaseDate: string;
  maturityDate?: string | null;
  maturityAmount?: number | null;
  nextPayoutAmount?: number | null;
  nextPayoutDate?: string | null;
  countInSavings?: boolean;
};

export type DashboardUnpaidItem = {
  id: number;
  type: 'expense' | 'bill';
  description: string;
  amount: number;
  dueDate: string;
  category: string;
};

export type DashboardConsumptionItem = {
  id: number;
  name: string;
  location: string;
  value: number;
  unit: string;
};

export type DashboardInvestmentPayout = {
  invName: string;
  owner: string;
  amount: number;
  date: string | null;
  isEstimated: boolean;
  label: string;
};

export type DashboardChartPoint = {
  name: string;
  amount: number;
};

export function useDashboardPageState() {
  const { user, aiDashboardAdvice, lastAiFingerprint, setAiDashboardAdvice } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const canUse = (mod: string) => canAccessModule(user, mod as Parameters<typeof canAccessModule>[1]);

  const businessEnabled = canUse('business');
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';
  const utilitySplitEnabled =
    canUse('utilities') &&
    (user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false);

  const utilityLabels = useMemo(() => resolveUtilitySplitLabels(user), [user]);
  const { onHouseholdSide, partnerId, counterpartyLabel } = utilityLabels;

  const householdName = user?.household?.name || 'Otthon';
  const householdMembers = user?.household?.users || [];

  const { greeting, GreetingIcon } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { greeting: 'Jó reggelt', GreetingIcon: Sun };
    if (hour >= 12 && hour < 18) return { greeting: 'Jó napot', GreetingIcon: Sun };
    if (hour >= 18 && hour < 21) return { greeting: 'Jó estét', GreetingIcon: Sunset };
    return { greeting: 'Jó éjszakát', GreetingIcon: Moon };
  }, []);

  const todayFormatted = useMemo(
    () =>
      new Date().toLocaleDateString('hu-HU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  const { transactions, updateTransaction, aiWeeklyBriefing, fetchAiWeeklyBriefing } = useBudgetStore();
  const { bills, settlements, updateBill, aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  const { savings, investments } = useSavingsStore();
  const { meters } = useMetersStore();
  const { orders } = useBusinessStore();
  const { debts } = useDebtsStore();
  const { selectedMonth, selectedYear, exchangeRates } = usePreferenceStore();

  const [, setIsAiLoading] = useState(false);

  const selectedYearMonthPrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const convertToHUF = (amount: number, currency: string) => (exchangeRates[currency] || 1) * amount;

  const monthlyOrders = orders.filter((o) => o.date.startsWith(selectedYearMonthPrefix));
  const businessTotal = monthlyOrders.reduce((s, o) => s + o.amount, 0);

  const monthTransactions = transactions.filter((t) => t.dueDate.startsWith(selectedYearMonthPrefix));
  const monthIncomes = monthTransactions.filter((t) => t.type === 'income');
  const monthExpenses = monthTransactions.filter((t) => t.type === 'expense');
  const utilityBills = bills.filter((b) => !isLegacySettlementBill(b));
  const monthBills = utilityBills.filter((b) => b.dueDate.startsWith(selectedYearMonthPrefix));
  const monthSettlement = settlements.find(
    (s) => s.year === selectedYear && s.month === selectedMonth,
  );

  const incomeReceived = monthIncomes.filter((t) => !!t.paidDate).reduce((sum, t) => sum + t.amount, 0);

  const actualSpent =
    monthExpenses.reduce((sum, tx) => {
      if (tx.isBudget && tx.subItems && tx.subItems.length > 0) {
        return sum + tx.subItems.reduce((subSum, si) => subSum + Math.abs(si.amount), 0);
      }
      return sum + (tx.paidDate ? tx.amount : 0);
    }, 0) +
    monthBills
      .filter((b) => !!b.paidDate)
      .reduce((sum, b) => sum + ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled), 0);

  const monthlyBalance = incomeReceived - actualSpent;
  const isOverspentThisMonth = monthlyBalance < 0;

  const { netBalance: rawRezsiBalance } = computeUtilityNetBalance(
    monthBills,
    user?.id,
    partnerId,
    utilitySplitEnabled,
  );
  const rezsiBalance = monthSettlement ? 0 : rawRezsiBalance;
  const totalBillsThisMonth = monthBills.reduce((s, b) => s + b.total, 0);
  const externalDebts = debts.reduce((s, d) => s + (d.targetAmount - d.paidAmount), 0);

  const consumptionData: DashboardConsumptionItem[] = meters.map((m) => {
    const reading = m.readings.find((r) => r.month === selectedMonth && r.year === selectedYear);
    return { id: m.id, name: m.name, location: m.location, value: reading?.consumption || 0, unit: m.unit };
  });

  const getInvestmentValue = (inv: Investment) => {
    const purchase = new Date(inv.purchaseDate);
    const now = new Date();
    const diffDays = Math.ceil(Math.max(0, now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
    if (inv.currentValue !== undefined && inv.currentValue !== null && Number(inv.currentValue) > 0) {
      const totalValue = Number(inv.currentValue);
      return { totalValue, accruedInterest: totalValue - Number(inv.principalAmount), daysPassed: diffDays, isManualOverride: true };
    }
    const dailyRate = Number(inv.annualInterestRate) / 100 / 365.25;
    const accruedInterest = Number(inv.principalAmount) * diffDays * dailyRate;
    const totalValue = Number(inv.principalAmount) + accruedInterest;
    return { totalValue, accruedInterest, daysPassed: diffDays, isManualOverride: false };
  };

  const getMaturityAmount = (inv: Investment) => {
    if (inv.maturityAmount) return inv.maturityAmount;
    if (inv.name.toUpperCase().includes('DKJ') && inv.maturityDate) {
      const purchase = new Date(inv.purchaseDate);
      const maturity = new Date(inv.maturityDate);
      const diffDays = Math.ceil(Math.max(0, maturity.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        const rate = Number(inv.annualInterestRate) / 100;
        return Math.round(Number(inv.principalAmount) * (1 + rate * (diffDays / 365.25)));
      }
    }
    return null;
  };

  const getEstimatedPayout = (inv: Investment) => {
    if (inv.nextPayoutAmount && inv.nextPayoutDate) {
      return { amount: inv.nextPayoutAmount, date: inv.nextPayoutDate, isEstimated: false, label: 'Következő kamat' };
    }
    const nameUpper = inv.name.toUpperCase();
    const now = new Date();
    if (nameUpper.includes('DKJ')) {
      const date = inv.maturityDate ? new Date(inv.maturityDate) : null;
      const amount = getMaturityAmount(inv) || inv.principalAmount;
      return { amount, date: date ? date.toISOString().split('T')[0] : null, isEstimated: true, label: 'Lejárati kifizetés' };
    }
    if (nameUpper.includes('FIXMÁP') || nameUpper.includes('FIX MÁP')) {
      const principal = getMaturityAmount(inv) || inv.principalAmount;
      const yearlyRate = Number(inv.annualInterestRate) || 7;
      const currentYear = now.getFullYear();
      const payoutMonths = [0, 3, 6, 9];
      let nextPayoutDateObj = new Date(currentYear, 6, 23);
      for (const m of payoutMonths) {
        const candidate = new Date(currentYear, m, 23);
        if (candidate > now) { nextPayoutDateObj = candidate; break; }
      }
      if (nextPayoutDateObj <= now) nextPayoutDateObj = new Date(currentYear + 1, 0, 23);
      const amount = Math.round((Number(principal) * (yearlyRate / 100)) / 4);
      return { amount, date: nextPayoutDateObj.toISOString().split('T')[0], isEstimated: true, label: 'Következő kamat' };
    }
    if (nameUpper.includes('PMÁP') || nameUpper.includes('PMAP')) {
      const maturity = inv.maturityDate ? new Date(inv.maturityDate) : null;
      const principal = getMaturityAmount(inv) || inv.principalAmount;
      const yearlyRate = Number(inv.annualInterestRate) || 0;
      let nextPayoutDateObj = new Date();
      if (maturity) {
        const payMonth = maturity.getMonth();
        const payDay = maturity.getDate();
        const currentYear = now.getFullYear();
        nextPayoutDateObj = new Date(currentYear, payMonth, payDay);
        if (nextPayoutDateObj <= now) nextPayoutDateObj = new Date(currentYear + 1, payMonth, payDay);
      } else {
        const purchase = new Date(inv.purchaseDate);
        nextPayoutDateObj = new Date(now.getFullYear(), purchase.getMonth(), purchase.getDate());
        if (nextPayoutDateObj <= now) nextPayoutDateObj = new Date(now.getFullYear() + 1, purchase.getMonth(), purchase.getDate());
      }
      const amount = Math.round(Number(principal) * (yearlyRate / 100));
      return { amount, date: nextPayoutDateObj.toISOString().split('T')[0], isEstimated: true, label: 'Következő kamat' };
    }
    if (inv.maturityDate) {
      return { amount: getMaturityAmount(inv) || inv.principalAmount, date: inv.maturityDate, isEstimated: true, label: 'Lejárati kifizetés' };
    }
    return null;
  };

  const savingsAccountsTotal = savings
    .filter((acc) => acc.count_in_savings !== false)
    .reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s, l) => s + l.amount, 0), acc.currency), 0);

  const totalInvestmentsValue = (investments as Investment[])
    .filter((i) => i.countInSavings !== false)
    .reduce((sum, inv) => sum + getInvestmentValue(inv).totalValue, 0);

  const totalSavings = savingsAccountsTotal + totalInvestmentsValue;

  const unpaidBills = bills.filter((b) => !b.paidDate && b.dueDate.startsWith(selectedYearMonthPrefix));
  const manualBalance = user?.household?.manualBalance ?? user?.household?.manual_balance ?? 0;

  const unpaidExpensesTotal =
    (canUse('budget')
      ? monthExpenses
          .filter((t) => !t.paidDate)
          .reduce((s, t) => {
            if (t.isBudget) {
              const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
              return s + Math.max(0, t.amount - spent);
            }
            return s + t.amount;
          }, 0)
      : 0) +
    (canUse('utilities')
      ? monthBills.filter((b) => !b.paidDate).reduce((s, b) => s + ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled), 0)
      : 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueExpensesTotal =
    (canUse('budget')
      ? monthExpenses
          .filter((t) => !t.paidDate && t.dueDate < todayStr)
          .reduce((s, t) => {
            if (t.isBudget) {
              const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
              return s + Math.max(0, t.amount - spent);
            }
            return s + t.amount;
          }, 0)
      : 0) +
    (canUse('utilities')
      ? monthBills
          .filter((b) => !b.paidDate && b.dueDate < todayStr)
          .reduce((s, b) => s + ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled), 0)
      : 0);

  const maradt = Number(manualBalance) - unpaidExpensesTotal;

  const unpaidItemsList: DashboardUnpaidItem[] = [
    ...(canUse('budget')
      ? monthExpenses.filter((t) => !t.paidDate).map((t) => ({
          id: t.id as number,
          type: 'expense' as const,
          description: t.description,
          amount:
            t.isBudget && t.subItems
              ? t.amount - t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0)
              : t.amount,
          dueDate: t.dueDate,
          category: t.category,
        }))
      : []),
    ...(canUse('utilities')
      ? monthBills.filter((b) => !b.paidDate).map((b) => {
          const ourPortion = ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled);
          return { id: b.id as number, type: 'bill' as const, description: `${b.type} számla`, amount: ourPortion, dueDate: b.dueDate, category: 'Rezsi' };
        })
      : []),
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  useEffect(() => {
    const currentFingerprint = JSON.stringify({
      totalSavings,
      businessTotal,
      monthlyBalance,
      isOverspentThisMonth,
      rezsiBalance,
      externalDebts,
      unpaidBillsCount: unpaidBills.length,
      heavyConsumption: consumptionData.some((c) => c.name === 'Villany' && c.value > 120),
      month: selectedYearMonthPrefix,
    });

    const fetchAiAdvice = async () => {
      if (lastAiFingerprint === currentFingerprint && aiDashboardAdvice) return;
      setIsAiLoading(true);
      try {
        const promises = [];
        if (canUse('budget')) promises.push(fetchAiWeeklyBriefing());
        if (canUse('utilities')) promises.push(fetchAiUtilityAnomalies(selectedYear, selectedMonth));
        await Promise.all(promises);
        if (canUse('budget') && aiWeeklyBriefing?.briefing_text) {
          setAiDashboardAdvice(aiWeeklyBriefing.briefing_text, currentFingerprint);
        } else {
          setAiDashboardAdvice('A havi egyenleg stabil.', currentFingerprint);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchAiAdvice, 1500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearMonthPrefix, totalSavings, businessTotal, incomeReceived, actualSpent, monthlyBalance, isOverspentThisMonth, rezsiBalance, externalDebts, unpaidBills.length]);

  const last6MonthsSparkline = useMemo(() => {
    const result: number[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const txTotal = transactions
        .filter((t) => t.type === 'expense' && t.dueDate.startsWith(prefix) && t.paidDate)
        .reduce((s, t) => s + t.amount, 0);
      const billTotal = bills
        .filter((b) => b.dueDate.startsWith(prefix) && b.paidDate)
        .reduce((s, b) => s + ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled), 0);
      result.push(txTotal + billTotal);
    }
    return result;
  }, [transactions, bills, onHouseholdSide, utilitySplitEnabled]);

  const last6MonthsIncome = useMemo(() => {
    const result: number[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const txTotal = transactions
        .filter((t) => t.type === 'income' && t.dueDate.startsWith(prefix) && t.paidDate)
        .reduce((s, t) => s + t.amount, 0);
      result.push(txTotal);
    }
    return result;
  }, [transactions]);

  const businessSparkline = useMemo(() => {
    return chartDataBuilder();
    function chartDataBuilder() {
      const result: number[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const total = orders.filter((o) => o.date.startsWith(prefix)).reduce((s, o) => s + o.amount, 0);
        result.push(total);
      }
      return result;
    }
  }, [orders]);

  const primaryMetrics: MetricItem[] = [];
  if (canUse('budget')) {
    primaryMetrics.push(
      {
        label: 'Egyenleg',
        value: formatHUF(Number(manualBalance)),
        info: HELP.dashboard.balance,
        hint: 'Jelenlegi keret',
        icon: Wallet,
        tone: 'primary',
        emphasis: true,
        sparkline: last6MonthsIncome.length > 1 ? last6MonthsIncome : undefined,
      },
      {
        label: 'Fizetendő',
        value: formatHUF(unpaidExpensesTotal),
        info: HELP.dashboard.payable,
        hint: unpaidItemsList.length > 0 ? `${unpaidItemsList.length} tétel` : 'Minden rendezve',
        icon: ReceiptText,
        tone: unpaidExpensesTotal > 0 ? 'warning' : 'success',
        sparkline: last6MonthsSparkline.length > 1 ? last6MonthsSparkline : undefined,
      },
      {
        label: 'Marad',
        value: formatHUF(maradt),
        info: HELP.dashboard.remaining,
        hint: 'Egyenleg − fizetendő',
        icon: TrendingUp,
        tone: maradt >= 0 ? 'success' : 'danger',
      },
      {
        label: 'Lejárt',
        value: formatHUF(overdueExpensesTotal),
        info: HELP.dashboard.overdue,
        hint: overdueExpensesTotal > 0 ? 'Sürgős!' : 'Nincs lejárt',
        icon: AlertCircle,
        tone: overdueExpensesTotal > 0 ? 'danger' : 'default',
      },
    );
  }

  const secondaryMetrics: MetricItem[] = [];
  if (canUse('savings')) {
    secondaryMetrics.push({
      label: 'Vagyon',
      value: formatHUF(totalSavings),
      info: HELP.dashboard.wealth,
      hint: 'Számlák és állampapírok',
      icon: PiggyBank,
      tone: 'primary',
      emphasis: true,
    });
  }
  if (businessEnabled) {
    secondaryMetrics.push({
      label: businessName,
      value: formatHUF(businessTotal),
      info: HELP.dashboard.business,
      hint: 'Tárgyhavi árbevétel',
      icon: TrendingUp,
      tone: 'info',
      sparkline: businessSparkline.length > 1 ? businessSparkline : undefined,
    });
  }
  if (canUse('utilities')) {
    secondaryMetrics.push({
      label: utilitySplitEnabled ? 'Rezsi mérleg' : 'Havi rezsi',
      value: utilitySplitEnabled ? `${rezsiBalance >= 0 ? '+' : ''}${formatHUF(rezsiBalance)}` : formatHUF(totalBillsThisMonth),
      info: HELP.dashboard.utilities,
      hint: utilitySplitEnabled
        ? rezsiBalance > 0
          ? `${counterpartyLabel} tartozik`
          : rezsiBalance < 0
            ? 'Te tartozol'
            : 'Rendezve'
        : 'Közüzemi számlák',
      icon: Users,
      tone: utilitySplitEnabled ? (rezsiBalance < 0 ? 'danger' : rezsiBalance > 0 ? 'success' : 'default') : 'default',
    });
  }
  if (canUse('debts')) {
    secondaryMetrics.push({
      label: 'Tartozások',
      value: formatHUF(externalDebts),
      info: HELP.dashboard.debts,
      hint: 'Hitelek és kölcsönök',
      icon: TrendingDown,
      tone: externalDebts > 0 ? 'warning' : 'success',
    });
  }

  const chartData: DashboardChartPoint[] = Object.entries(
    orders.reduce((acc, o) => {
      const k = o.date.substring(0, 7);
      acc[k] = (acc[k] || 0) + o.amount;
      return acc;
    }, {} as Record<string, number>),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, v]) => ({ name: k.replace('-', '.'), amount: v }));

  const investmentPayouts: DashboardInvestmentPayout[] = (investments as Investment[])
    .map((inv) => {
      const p = getEstimatedPayout(inv);
      if (!p) return null;
      return { invName: inv.name, owner: inv.owner, ...p };
    })
    .filter((p): p is DashboardInvestmentPayout => p !== null)
    .sort((a, b) => (!a.date ? 1 : !b.date ? -1 : new Date(a.date).getTime() - new Date(b.date).getTime()));

  const handlePayItem = async (item: DashboardUnpaidItem) => {
    const today = new Date().toISOString().split('T')[0];
    if (item.type === 'expense') await updateTransaction(item.id, { paidDate: today });
    else await updateBill(item.id, { paidDate: today });
  };

  return {
    user,
    isAdmin,
    canUse,
    businessEnabled,
    utilitySplitEnabled,
    counterpartyLabel,
    householdName,
    householdMembers,
    greeting,
    GreetingIcon,
    todayFormatted,
    aiDashboardAdvice,
    unpaidBills,
    rezsiBalance,
    primaryMetrics,
    secondaryMetrics,
    unpaidItemsList,
    todayStr,
    monthBills,
    consumptionData,
    investments,
    investmentPayouts,
    totalInvestmentsValue,
    chartData,
    handlePayItem,
  };
}

export type DashboardPageState = ReturnType<typeof useDashboardPageState>;
