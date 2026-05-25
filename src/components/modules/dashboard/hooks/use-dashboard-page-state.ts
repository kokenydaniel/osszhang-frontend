import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useMetersStore } from '@/stores/useMetersStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF, isDueOverdue, compareDates } from '@/utils';
import { dayjs, d, formatTodayLong, toDateString, today as todayDate } from '@/lib/dates';
import { isLegacySettlementBill } from '@/lib/utilityBills';
import { computeUtilityNetBalance } from '@/lib/utilityBalance';
import { ourUtilityPortion, resolveUtilitySplitLabels } from '@/lib/utilityViewer';
import { LedgerEntry } from '@/types';
import { HELP } from '@/lib/helpTexts';
import { canUseModuleWithTier } from '@/lib/moduleAccess';
import { canUseFeature } from '@/lib/checkAccess';
import { isHouseholdReader } from '@/lib/householdRole';
import { activeWalletManualBalance } from '@/lib/walletBalance';
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
  const isReader = isHouseholdReader(user);
  const canUse = (mod: string) => canUseModuleWithTier(user, mod as Parameters<typeof canUseModuleWithTier>[1]);
  const canUseBudget = user ? canUseModuleWithTier(user, 'budget') : false;
  const canUseAi = canUseFeature(user, 'ai');
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const fetchTransactions = useBudgetStore((s) => s.fetchTransactions);
  const loadedWalletId = useBudgetStore((s) => s.loadedWalletId);
  const walletLoading = useBudgetStore((s) => s.isLoading);

  useEffect(() => {
    if (!canUseBudget || activeWalletId === null) return;
    if (loadedWalletId === activeWalletId && !walletLoading) return;
    void fetchTransactions(activeWalletId);
  }, [activeWalletId, canUseBudget, fetchTransactions, loadedWalletId, walletLoading]);

  const businessEnabled = canUse('business');
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';
  const utilitySplitConfigured =
    user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled =
    canUse('utilities') && utilitySplitConfigured && canUseFeature(user, 'utility_split');

  const utilityLabels = useMemo(() => resolveUtilitySplitLabels(user), [user]);
  const { onHouseholdSide, partnerId, counterpartyLabel } = utilityLabels;

  const householdName = user?.household?.name || 'Otthon';
  const householdMembers = user?.household?.users || [];

  const { greeting, GreetingIcon } = useMemo(() => {
    const hour = dayjs().hour();
    if (hour >= 5 && hour < 12) return { greeting: 'Jó reggelt', GreetingIcon: Sun };
    if (hour >= 12 && hour < 18) return { greeting: 'Jó napot', GreetingIcon: Sun };
    if (hour >= 18 && hour < 21) return { greeting: 'Jó estét', GreetingIcon: Sunset };
    return { greeting: 'Jó éjszakát', GreetingIcon: Moon };
  }, []);

  const todayFormatted = formatTodayLong();

  const { transactions, updateTransaction, aiWeeklyBriefing, fetchAiWeeklyBriefing } = useBudgetStore();
  const { bills, settlements, updateBill, aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  const { savings, investments } = useSavingsStore();
  const { meters } = useMetersStore();
  const { orders } = useBusinessStore();
  const { debts } = useDebtsStore();
  const { selectedMonth, selectedYear, exchangeRates } = usePreferenceStore();

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
    const purchase = d(inv.purchaseDate);
    const now = dayjs();
    const diffDays = Math.ceil(Math.max(0, now.diff(purchase, 'day')));
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
      const purchase = d(inv.purchaseDate);
      const maturity = d(inv.maturityDate);
      const diffDays = Math.ceil(Math.max(0, maturity.diff(purchase, 'day')));
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
    const now = dayjs();
    if (nameUpper.includes('DKJ')) {
      const maturityDate = inv.maturityDate ? d(inv.maturityDate) : null;
      const amount = getMaturityAmount(inv) || inv.principalAmount;
      return { amount, date: maturityDate ? toDateString(maturityDate) : null, isEstimated: true, label: 'Lejárati kifizetés' };
    }
    if (nameUpper.includes('FIXMÁP') || nameUpper.includes('FIX MÁP')) {
      const principal = getMaturityAmount(inv) || inv.principalAmount;
      const yearlyRate = Number(inv.annualInterestRate) || 7;
      const currentYear = now.year();
      const payoutMonths = [0, 3, 6, 9];
      let nextPayoutDateObj = dayjs().year(currentYear).month(6).date(23);
      for (const m of payoutMonths) {
        const candidate = dayjs().year(currentYear).month(m).date(23);
        if (candidate.isAfter(now, 'day')) { nextPayoutDateObj = candidate; break; }
      }
      if (!nextPayoutDateObj.isAfter(now, 'day')) nextPayoutDateObj = dayjs().year(currentYear + 1).month(0).date(23);
      const amount = Math.round((Number(principal) * (yearlyRate / 100)) / 4);
      return { amount, date: toDateString(nextPayoutDateObj), isEstimated: true, label: 'Következő kamat' };
    }
    if (nameUpper.includes('PMÁP') || nameUpper.includes('PMAP')) {
      const maturity = inv.maturityDate ? d(inv.maturityDate) : null;
      const principal = getMaturityAmount(inv) || inv.principalAmount;
      const yearlyRate = Number(inv.annualInterestRate) || 0;
      let nextPayoutDateObj = dayjs();
      if (maturity) {
        const payMonth = maturity.month();
        const payDay = maturity.date();
        const currentYear = now.year();
        nextPayoutDateObj = dayjs().year(currentYear).month(payMonth).date(payDay);
        if (!nextPayoutDateObj.isAfter(now, 'day')) nextPayoutDateObj = dayjs().year(currentYear + 1).month(payMonth).date(payDay);
      } else {
        const purchase = d(inv.purchaseDate);
        nextPayoutDateObj = dayjs().year(now.year()).month(purchase.month()).date(purchase.date());
        if (!nextPayoutDateObj.isAfter(now, 'day')) {
          nextPayoutDateObj = dayjs().year(now.year() + 1).month(purchase.month()).date(purchase.date());
        }
      }
      const amount = Math.round(Number(principal) * (yearlyRate / 100));
      return { amount, date: toDateString(nextPayoutDateObj), isEstimated: true, label: 'Következő kamat' };
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
  const manualBalance = activeWalletManualBalance(user);

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

  const todayStr = todayDate();
  const overdueExpensesTotal =
    (canUse('budget')
      ? monthExpenses
          .filter((t) => isDueOverdue(t, todayStr))
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
          .filter((b) => isDueOverdue(b, todayStr))
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
  ].sort((a, b) => compareDates(a.dueDate, b.dueDate));

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
      walletId: activeWalletId,
    });

    const fetchAiAdvice = async () => {
      if (!canUseAi) return;
      if (activeWalletId === null || loadedWalletId !== activeWalletId || walletLoading) return;
      if (lastAiFingerprint === currentFingerprint && aiDashboardAdvice) return;
      try {
        const promises = [];
        if (canUse('budget')) promises.push(fetchAiWeeklyBriefing(undefined, activeWalletId));
        if (canUse('utilities')) promises.push(fetchAiUtilityAnomalies(selectedYear, selectedMonth));
        await Promise.all(promises);
        if (canUse('budget') && aiWeeklyBriefing?.briefing_text) {
          setAiDashboardAdvice(aiWeeklyBriefing.briefing_text, currentFingerprint);
        } else {
          setAiDashboardAdvice('A havi egyenleg stabil.', currentFingerprint);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const timeoutId = setTimeout(fetchAiAdvice, 1500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearMonthPrefix, totalSavings, businessTotal, incomeReceived, actualSpent, monthlyBalance, isOverspentThisMonth, rezsiBalance, externalDebts, unpaidBills.length, activeWalletId, canUseAi, loadedWalletId, walletLoading]);

  const last6MonthsSparkline = useMemo(() => {
    const result: number[] = [];
    const now = dayjs();
    for (let i = 5; i >= 0; i--) {
      const monthDate = now.subtract(i, 'month').startOf('month');
      const prefix = monthDate.format('YYYY-MM');
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
    const now = dayjs();
    for (let i = 5; i >= 0; i--) {
      const monthDate = now.subtract(i, 'month').startOf('month');
      const prefix = monthDate.format('YYYY-MM');
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
      const now = dayjs();
      for (let i = 5; i >= 0; i--) {
        const monthDate = now.subtract(i, 'month').startOf('month');
        const prefix = monthDate.format('YYYY-MM');
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
    .sort((a, b) => (!a.date ? 1 : !b.date ? -1 : compareDates(a.date, b.date)));

  const handlePayItem = async (item: DashboardUnpaidItem) => {
    if (isReader) return;
    const paidOn = todayDate();
    if (item.type === 'expense') await updateTransaction(item.id, { paidDate: paidOn });
    else await updateBill(item.id, { paidDate: paidOn });
  };

  return {
    user,
    isAdmin,
    isReader,
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
