'use client';

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
import { LedgerEntry } from '@/types';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HELP } from '@/lib/helpTexts';
import {
  PageHeader,
  MetricStrip,
  DataTable,
  Section,
  StatusPill,
  EmptyState,
  AccentPanel,
  type MetricItem,
  type DataTableColumn,
} from '@/components/design';
import {
  Wallet,
  TrendingUp,
  Users,
  AlertCircle,
  Zap,
  Droplets,
  Flame,
  TrendingDown,
  RefreshCw,
  Check,
  Calendar,
  Sun,
  Sunset,
  Moon,
  PiggyBank,
  ReceiptText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

type Investment = {
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

export default function DashboardClient() {
  const { user, aiDashboardAdvice, lastAiFingerprint, setAiDashboardAdvice } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const userPermissions = user?.permissions || [];
  const hasPermission = (mod: string) => isAdmin || userPermissions.includes(mod);

  const businessEnabled =
    (user?.household?.businessEnabled ?? user?.household?.business_enabled ?? false) && hasPermission('business');
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';
  const utilitySplitEnabled =
    (user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false) &&
    hasPermission('utilities');

  const partnerId = user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id;
  const partnerUser =
    user?.id && partnerId && Number(user.id) === Number(partnerId)
      ? user?.household?.users?.find((hu) => Number(hu.id) !== Number(user.id))
      : user?.household?.users?.find((hu) => Number(hu.id) === Number(partnerId)) ||
        user?.household?.users?.find((hu) => Number(hu.id) !== Number(user.id));
  const partnerName = partnerUser?.firstName || 'Családtag';

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
      .reduce((sum, b) => {
        const isOurPrivate = isAdmin ? b.splitRule === 'dani-private' : b.splitRule === 'ildi-private';
        const ourPortion = b.splitRule === 'shared' ? b.total / 2 : isOurPrivate ? b.total : 0;
        return sum + ourPortion;
      }, 0);

  const monthlyBalance = incomeReceived - actualSpent;
  const isOverspentThisMonth = monthlyBalance < 0;

  const { netBalance: rawRezsiBalance } = computeUtilityNetBalance(
    monthBills,
    isAdmin,
    utilitySplitEnabled,
  );
  const rezsiBalance = monthSettlement ? 0 : rawRezsiBalance;
  const totalBillsThisMonth = monthBills.reduce((s, b) => s + b.total, 0);
  const externalDebts = debts.reduce((s, d) => s + (d.targetAmount - d.paidAmount), 0);

  const consumptionData = meters.map((m) => {
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
    (hasPermission('budget')
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
    (hasPermission('utilities')
      ? monthBills.filter((b) => !b.paidDate).reduce((s, b) => {
          const isOurPrivate = isAdmin ? b.splitRule === 'dani-private' : b.splitRule === 'ildi-private';
          return s + (b.splitRule === 'shared' ? b.total / 2 : isOurPrivate ? b.total : 0);
        }, 0)
      : 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueExpensesTotal =
    (hasPermission('budget')
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
    (hasPermission('utilities')
      ? monthBills
          .filter((b) => !b.paidDate && b.dueDate < todayStr)
          .reduce((s, b) => {
            const isOurPrivate = isAdmin ? b.splitRule === 'dani-private' : b.splitRule === 'ildi-private';
            return s + (b.splitRule === 'shared' ? b.total / 2 : isOurPrivate ? b.total : 0);
          }, 0)
      : 0);

  const maradt = Number(manualBalance) - unpaidExpensesTotal;

  const unpaidItemsList = [
    ...(hasPermission('budget')
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
    ...(hasPermission('utilities')
      ? monthBills.filter((b) => !b.paidDate).map((b) => {
          const isOurPrivate = isAdmin ? b.splitRule === 'dani-private' : b.splitRule === 'ildi-private';
          const ourPortion = b.splitRule === 'shared' ? b.total / 2 : isOurPrivate ? b.total : 0;
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
        if (hasPermission('budget')) promises.push(fetchAiWeeklyBriefing());
        if (hasPermission('utilities')) promises.push(fetchAiUtilityAnomalies(selectedYear, selectedMonth));
        await Promise.all(promises);
        if (hasPermission('budget') && aiWeeklyBriefing?.briefing_text) {
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

  // Build last-6-month spending sparkline from past expenses + bills
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
        .reduce((s, b) => {
          const isOurPrivate = isAdmin ? b.splitRule === 'dani-private' : b.splitRule === 'ildi-private';
          return s + (b.splitRule === 'shared' ? b.total / 2 : isOurPrivate ? b.total : 0);
        }, 0);
      result.push(txTotal + billTotal);
    }
    return result;
  }, [transactions, bills, isAdmin]);

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
  if (hasPermission('budget')) {
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
  if (hasPermission('savings')) {
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
  if (hasPermission('utilities')) {
    secondaryMetrics.push({
      label: utilitySplitEnabled ? 'Rezsi mérleg' : 'Havi rezsi',
      value: utilitySplitEnabled ? `${rezsiBalance >= 0 ? '+' : ''}${formatHUF(rezsiBalance)}` : formatHUF(totalBillsThisMonth),
      info: HELP.dashboard.utilities,
      hint: utilitySplitEnabled
        ? rezsiBalance > 0
          ? `${partnerName} tartozik`
          : rezsiBalance < 0
            ? 'Te tartozol'
            : 'Rendezve'
        : 'Közüzemi számlák',
      icon: Users,
      tone: utilitySplitEnabled ? (rezsiBalance < 0 ? 'danger' : rezsiBalance > 0 ? 'success' : 'default') : 'default',
    });
  }
  if (hasPermission('debts')) {
    secondaryMetrics.push({
      label: 'Tartozások',
      value: formatHUF(externalDebts),
      info: HELP.dashboard.debts,
      hint: 'Hitelek és kölcsönök',
      icon: TrendingDown,
      tone: externalDebts > 0 ? 'warning' : 'success',
    });
  }

  const chartData = Object.entries(
    orders.reduce((acc, o) => {
      const k = o.date.substring(0, 7);
      acc[k] = (acc[k] || 0) + o.amount;
      return acc;
    }, {} as Record<string, number>),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, v]) => ({ name: k.replace('-', '.'), amount: v }));

  const investmentPayouts = (investments as Investment[])
    .map((inv) => {
      const p = getEstimatedPayout(inv);
      if (!p) return null;
      return { invName: inv.name, owner: inv.owner, ...p };
    })
    .filter(Boolean)
    .sort((a, b) => (!a!.date ? 1 : !b!.date ? -1 : new Date(a!.date!).getTime() - new Date(b!.date!).getTime()));

  const handlePayItem = async (item: typeof unpaidItemsList[number]) => {
    const today = new Date().toISOString().split('T')[0];
    if (item.type === 'expense') await updateTransaction(item.id, { paidDate: today });
    else await updateBill(item.id, { paidDate: today });
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Háztartás' }, { label: householdName }]}
        title={`${greeting}, ${user?.firstName || 'Gazda'}`}
        description={
          <span className="inline-flex items-center gap-2">
            <GreetingIcon size={14} className="text-primary" />
            <span className="capitalize">{todayFormatted}</span>
            <span className="text-border">·</span>
            <span>Itt a mai pénzügyi képed.</span>
          </span>
        }
        meta={
          householdMembers.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Család</span>
              <div className="flex -space-x-1.5">
                {householdMembers.slice(0, 5).map((member: { id: number; firstName?: string; lastName?: string }) => {
                  const mi = ((member.firstName || '?')[0] + (member.lastName || '?')[0]).toUpperCase();
                  return (
                    <div
                      key={member.id}
                      title={`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                      className="h-6 w-6 rounded-full bg-muted text-[0.6rem] font-semibold text-foreground flex items-center justify-center ring-2 ring-background"
                    >
                      {mi}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null
        }
      />

      {/* Alert banners */}
      {(unpaidBills.length > 0 && hasPermission('utilities')) || (utilitySplitEnabled && rezsiBalance !== 0 && hasPermission('utilities')) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {unpaidBills.length > 0 && hasPermission('utilities') && (
            <AccentPanel tone="danger" icon={AlertCircle} title="Lejárt rezsi várakozik" description={`${unpaidBills.length} kifizetetlen rezsi-tétel`}>
              Kattints a tételre a kifizetés rögzítéséhez lent.
            </AccentPanel>
          )}
          {utilitySplitEnabled && rezsiBalance !== 0 && hasPermission('utilities') && (
            <AccentPanel
              tone={rezsiBalance < 0 ? 'warning' : 'success'}
              icon={Users}
              title={rezsiBalance < 0 ? `Tartozásod van ${partnerName}-nek` : `${partnerName} tartozik neked`}
              description={`Aktuális rezsi-egyenleg: ${formatHUF(Math.abs(rezsiBalance))}`}
              action={
                <Link href="/utilities" className="text-xs font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-0.5">
                  Részletek <ChevronRight size={11} />
                </Link>
              }
            >
              <span className="tabular-nums text-lg font-semibold text-foreground">{formatHUF(Math.abs(rezsiBalance))}</span>
            </AccentPanel>
          )}
        </div>
      ) : null}

      {/* Primary metrics */}
      {primaryMetrics.length > 0 && <MetricStrip items={primaryMetrics} columns={4} variant="separated" />}

      {/* Secondary metrics */}
      {secondaryMetrics.length > 0 && (
        <MetricStrip
          items={secondaryMetrics}
          columns={Math.min(4, Math.max(2, secondaryMetrics.length)) as 2 | 3 | 4}
          variant="separated"
        />
      )}

      {/* Main bento grid — adaptive based on permissions */}
      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          hasPermission('budget') ? 'lg:grid-cols-5' : 'lg:grid-cols-2',
        )}
      >
        {/* Upcoming payments */}
        {hasPermission('budget') && (
          <div className="lg:col-span-3">
            <Section
              title="Közelgő befizetések"
              description={`${unpaidItemsList.length} függőben lévő tétel ebben a hónapban`}
              action={
                unpaidItemsList.length > 0 ? (
                  <StatusPill status="primary" dot>
                    {unpaidItemsList.length} tétel
                  </StatusPill>
                ) : null
              }
            >
              {unpaidItemsList.length === 0 ? (
                <EmptyState
                  icon={Check}
                  title="Minden rendezve"
                  description="Ebben a hónapban nincs több fizetendő tétel."
                />
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'desc',
                      header: 'Tétel',
                      width: '40%',
                      cell: (item) => {
                        const overdue = item.dueDate < todayStr;
                        const Icon = item.type === 'bill' ? ReceiptText : Wallet;
                        const toneCls = overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
                        return (
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', toneCls)}>
                              <Icon size={13} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">{item.description}</div>
                              <div className="text-[0.7rem] text-muted-foreground mt-0.5">{item.category}</div>
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      key: 'due',
                      header: 'Határidő',
                      width: '22%',
                      cell: (item) => {
                        const overdue = item.dueDate < todayStr;
                        return (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-xs tabular-nums',
                              overdue ? 'text-rose-600 font-medium' : 'text-muted-foreground',
                            )}
                          >
                            <Calendar size={11} strokeWidth={2.2} />
                            {item.dueDate.replace(/-/g, '.')}
                            {overdue && <span className="text-[10px] uppercase tracking-wider">lejárt</span>}
                          </span>
                        );
                      },
                    },
                    {
                      key: 'amount',
                      header: 'Összeg',
                      align: 'right',
                      width: '24%',
                      cell: (item) => (
                        <span className="text-sm font-semibold text-foreground tabular-nums">{formatHUF(item.amount)}</span>
                      ),
                    },
                    {
                      key: 'action',
                      header: '',
                      align: 'right',
                      width: '14%',
                      cell: (item) => (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handlePayItem(item)}
                          className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                          title="Kifizetve"
                        >
                          <Check size={14} />
                        </Button>
                      ),
                    },
                  ] as DataTableColumn<typeof unpaidItemsList[number]>[]}
                  data={unpaidItemsList}
                  rowKey={(item) => `${item.type}-${item.id}`}
                  minWidth="540px"
                />
              )}
            </Section>
          </div>
        )}

        {/* Utility bills snapshot (visible to utilities users w/o budget) */}
        {!hasPermission('budget') && hasPermission('utilities') && (
          <Section
            title="Aktuális rezsi"
            description={`${monthBills.length} számla ebben a hónapban`}
            action={
              <Link href="/utilities" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
                Részletek <ChevronRight size={11} />
              </Link>
            }
          >
            {monthBills.length === 0 ? (
              <EmptyState icon={ReceiptText} title="Nincs rezsi" description="Ebben a hónapban még nincs rögzített számla." />
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
                {monthBills
                  .slice()
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 6)
                  .map((b, i) => {
                    const overdue = !b.paidDate && b.dueDate < todayStr;
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors',
                          i > 0 && 'border-t border-border',
                        )}
                      >
                        <div
                          className={cn(
                            'h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-white shadow-sm',
                            b.paidDate
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                              : overdue
                                ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                                : 'bg-gradient-to-br from-amber-400 to-orange-500',
                          )}
                        >
                          <ReceiptText size={14} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{b.type}</div>
                          <div className="text-[0.7rem] text-muted-foreground tabular-nums mt-0.5">
                            {b.dueDate.replace(/-/g, '.')}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-foreground tabular-nums">{formatHUF(b.total)}</div>
                          <StatusPill
                            status={b.paidDate ? 'success' : overdue ? 'danger' : 'warning'}
                            size="xs"
                            dot
                          >
                            {b.paidDate ? 'kész' : overdue ? 'lejárt' : 'függőben'}
                          </StatusPill>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Section>
        )}

        {/* Side column */}
        <div className={cn('flex flex-col gap-6', hasPermission('budget') ? 'lg:col-span-2' : '')}>
          {hasPermission('meters') && consumptionData.length > 0 && (
            <Section
              title="Közműfogyasztás"
              description="Aktuális havi értékek"
              action={
                <Link href="/meters" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
                  Részletek <ChevronRight size={11} />
                </Link>
              }
            >
              <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
                {consumptionData.map((m, i) => {
                  const Icon = m.name.includes('Villany') ? Zap : m.name.includes('Víz') ? Droplets : Flame;
                  const iconBg = m.name.includes('Villany')
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : m.name.includes('Víz')
                      ? 'bg-gradient-to-br from-sky-400 to-cyan-500'
                      : 'bg-gradient-to-br from-rose-400 to-orange-500';
                  const maxValue = Math.max(...consumptionData.map((c) => c.value || 1));
                  const progress = maxValue > 0 ? (m.value / maxValue) * 100 : 0;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors',
                        i > 0 && 'border-t border-border',
                      )}
                    >
                      <div className={cn('h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-white shadow-sm', iconBg)}>
                        <Icon size={14} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="min-w-0 mr-2">
                            <span className="text-xs font-medium text-foreground block truncate">{m.name}</span>
                            {m.location && (
                              <span className="text-[0.65rem] text-muted-foreground truncate block">{m.location}</span>
                            )}
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                            {m.value}
                            <span className="text-[0.65rem] font-normal text-muted-foreground ml-0.5">{m.unit}</span>
                          </span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              m.name.includes('Villany')
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                : m.name.includes('Víz')
                                  ? 'bg-gradient-to-r from-sky-400 to-cyan-500'
                                  : 'bg-gradient-to-r from-rose-400 to-orange-500',
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {hasPermission('savings') && (
            <Section
              title="Állampapír kifizetések"
              description="Soron következő kamatok"
              action={
                <span className="text-xs font-medium text-emerald-600 tabular-nums">
                  ∑ {formatHUF(totalInvestmentsValue)}
                </span>
              }
            >
              {investments.length === 0 ? (
                <EmptyState
                  icon={PiggyBank}
                  title="Nincs aktív állampapír"
                  action={
                    <Link href="/budget" className="text-xs font-medium text-primary hover:underline">
                      Befektetések →
                    </Link>
                  }
                />
              ) : investmentPayouts.length === 0 ? (
                <EmptyState icon={Calendar} title="Nincs ütemezett kifizetés" description="Nem ismert következő kamatkifizetési dátum." />
              ) : (
                <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
                  {investmentPayouts.slice(0, 4).map((p, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors',
                        idx > 0 && 'border-t border-border',
                      )}
                    >
                      <div className="h-9 w-9 shrink-0 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-sm">
                        <PiggyBank size={14} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{p!.invName}</div>
                        <div className="text-[0.7rem] text-muted-foreground mt-0.5">
                          {p!.owner} · {p!.label}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-emerald-600 tabular-nums">+{formatHUF(p!.amount)}</div>
                        <div className="text-[0.65rem] text-muted-foreground tabular-nums">{p!.date ? p!.date.replace(/-/g, '.') : 'Lejáratkor'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>
      </div>

      {/* Business chart full width */}
      {businessEnabled && chartData.length > 0 && (
        <Section
          title="Árbevétel · utolsó 6 hónap"
          description="Vállalkozás havi forgalom trend"
          action={
            <Link href="/business" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
              Vállalkozás <ChevronRight size={11} />
            </Link>
          }
        >
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.22 275)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="oklch(0.55 0.22 275)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'oklch(0.50 0.012 260)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'oklch(0.50 0.012 260)' }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'oklch(0.995 0.002 250)',
                    border: '1px solid oklch(0.92 0.004 250)',
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)',
                  }}
                  formatter={(val) => formatHUF(Number(val ?? 0))}
                />
                <Area type="monotone" dataKey="amount" stroke="oklch(0.55 0.22 275)" strokeWidth={2} fillOpacity={1} fill="url(#aG)" activeDot={{ r: 4, fill: 'oklch(0.55 0.22 275)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Footer AI advice (subtle) */}
      {aiDashboardAdvice && hasPermission('budget') && (
        <AccentPanel
          tone="ai"
          icon={Sparkles}
          title="Heti AI tájékoztató"
          titleInfo={HELP.dashboard.aiBriefing}
          description="Az aktuális adatokra szabott összegzés"
          glow
        >
          {aiDashboardAdvice}
        </AccentPanel>
      )}
    </div>
  );
}
