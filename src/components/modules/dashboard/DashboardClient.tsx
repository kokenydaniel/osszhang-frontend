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
import { LedgerEntry } from '@/types';
import { aiFinanceClient } from '@/api';
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, AreaChart, Area } from 'recharts';
import { 
  Rocket, 
  Wallet, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Cpu, 
  Zap, 
  Droplets, 
  Flame, 
  ArrowRight,
  TrendingDown,
  Info,
  RefreshCw,
  Check,
  Calendar,
  Home,
  Sun,
  Sunset,
  Moon,
  Sparkles
} from 'lucide-react';

export default function DashboardClient() {
  const { user, aiDashboardAdvice, lastAiFingerprint, setAiDashboardAdvice } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const userPermissions = user?.permissions || [];
  const hasPermission = (mod: string) => isAdmin || userPermissions.includes(mod);

  const businessEnabled = (user?.household?.businessEnabled ?? user?.household?.business_enabled ?? true) && hasPermission('business');
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';
  const utilitySplitEnabled = (user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? true) && hasPermission('utilities');
  
  const partnerId = user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id;
  const partnerUser = (user?.id && partnerId && Number(user.id) === Number(partnerId))
    ? user?.household?.users?.find(hu => Number(hu.id) !== Number(user.id))
    : (user?.household?.users?.find(hu => Number(hu.id) === Number(partnerId)) || user?.household?.users?.find(hu => Number(hu.id) !== Number(user.id)));
  const partnerName = partnerUser?.firstName || 'Családtag';

  const householdName = user?.household?.name || 'Otthon';
  const householdMembers = user?.household?.users || [];

  const { greeting, GreetingIcon, greetingGradient } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return {
      greeting: 'Jó reggelt',
      GreetingIcon: Sun,
      greetingGradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
    };
    if (hour >= 12 && hour < 18) return {
      greeting: 'Jó napot',
      GreetingIcon: Sun,
      greetingGradient: 'from-sky-500/20 via-blue-500/10 to-transparent'
    };
    if (hour >= 18 && hour < 21) return {
      greeting: 'Jó estét',
      GreetingIcon: Sunset,
      greetingGradient: 'from-purple-500/20 via-pink-500/10 to-transparent'
    };
    return {
      greeting: 'Jó éjszakát',
      GreetingIcon: Moon,
      greetingGradient: 'from-indigo-500/20 via-slate-500/10 to-transparent'
    };
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('hu-HU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const { transactions, updateTransaction, aiWeeklyBriefing, fetchAiWeeklyBriefing } = useBudgetStore();
  const { bills, updateBill, aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  const { savings, investments } = useSavingsStore();
  const { meters } = useMetersStore();
  const { orders } = useBusinessStore();
  const { debts } = useDebtsStore();
  const { selectedMonth, selectedYear, exchangeRates } = usePreferenceStore();
  
  const [isAiLoading, setIsAiLoading] = useState(false);

  const selectedYearMonthPrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const convertToHUF = (amount: number, currency: string) => {
    const rate = exchangeRates[currency] || 1;
    return amount * rate;
  };

  // --- BUSINESS ANALYTICS ---
  const monthlyOrders = orders.filter(o => o.date.startsWith(selectedYearMonthPrefix));
  const businessTotal = monthlyOrders.reduce((s,o) => s + o.amount, 0);
  const businessPending = monthlyOrders.filter(o => o.state !== 'RENDBEN').reduce((s,o) => s + o.amount, 0);

  // --- MONTHLY CASHFLOW HEALTH ---
  const monthTransactions = transactions.filter(t => t.dueDate.startsWith(selectedYearMonthPrefix));
  const monthIncomes = monthTransactions.filter(t => t.type === 'income');
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
  const monthBills = bills.filter(b => b.dueDate.startsWith(selectedYearMonthPrefix));

  const incomeReceived = monthIncomes
    .filter(t => !!t.paidDate)
    .reduce((sum, t) => sum + t.amount, 0);

  const actualSpent = monthExpenses.reduce((sum, tx) => {
    if (tx.isBudget && tx.subItems && tx.subItems.length > 0) {
      return sum + tx.subItems.reduce((subSum, si) => subSum + Math.abs(si.amount), 0);
    }
    return sum + (tx.paidDate ? tx.amount : 0);
  }, 0) + monthBills
    .filter(b => !!b.paidDate)
    .reduce((sum, b) => {
      const isOurPrivate = isAdmin ? (b.splitRule === 'dani-private') : (b.splitRule === 'ildi-private');
      const ourPortion = b.splitRule === 'shared' ? b.total / 2 : (isOurPrivate ? b.total : 0);
      return sum + ourPortion;
    }, 0);

  const monthlyBalance = incomeReceived - actualSpent;
  const isOverspentThisMonth = monthlyBalance < 0;

  // --- UTILITIES & DEBTS ---
  let partnerOwesUs = 0;
  let weOwePartner = 0;
  bills.forEach(b => {
    // If the logged-in user paid:
    const wePaid = isAdmin ? (b.paidBy === 'Mi') : (b.paidBy === 'Ildi');
    const partnerPaid = isAdmin ? (b.paidBy === 'Ildi') : (b.paidBy === 'Mi');
    
    // Who owns/benefited from the bill private portion?
    const isOurPrivate = isAdmin ? (b.splitRule === 'dani-private') : (b.splitRule === 'ildi-private');
    const isPartnerPrivate = isAdmin ? (b.splitRule === 'ildi-private') : (b.splitRule === 'dani-private');

    if (wePaid) {
       if (b.splitRule === 'shared') partnerOwesUs += b.total / 2;
       if (isPartnerPrivate) partnerOwesUs += b.total;
    } else if (partnerPaid) {
       if (b.splitRule === 'shared') weOwePartner += b.total / 2;
       if (isOurPrivate) weOwePartner += b.total;
    }
  });
  const rezsiBalance = partnerOwesUs - weOwePartner;
  const totalBillsThisMonth = monthBills.reduce((s, b) => s + b.total, 0);
  const externalDebts = debts.reduce((s, d) => s + (d.targetAmount - d.paidAmount), 0);

  // --- CONSUMPTION ---
  const consumptionData = meters.map(m => {
    const reading = m.readings.find(r => r.month === selectedMonth && r.year === selectedYear);
    return { name: m.name, value: reading?.consumption || 0, unit: m.unit };
  });

  const getInvestmentValue = (inv: any) => {
    const purchase = new Date(inv.purchaseDate);
    const now = new Date();
    
    const diffTime = Math.max(0, now.getTime() - purchase.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (inv.currentValue !== undefined && inv.currentValue !== null && Number(inv.currentValue) > 0) {
      const totalValue = Number(inv.currentValue);
      const accruedInterest = totalValue - Number(inv.principalAmount);
      return {
        accruedInterest,
        totalValue,
        daysPassed: diffDays,
        isManualOverride: true
      };
    }
    
    const dailyRate = (Number(inv.annualInterestRate) / 100) / 365.25;
    const accruedInterest = Number(inv.principalAmount) * diffDays * dailyRate;
    const totalValue = Number(inv.principalAmount) + accruedInterest;
    
    return {
      accruedInterest,
      totalValue,
      daysPassed: diffDays,
      isManualOverride: false
    };
  };

  const getMaturityAmount = (inv: any) => {
    if (inv.maturityAmount) return inv.maturityAmount;
    
    if (inv.name.toUpperCase().includes('DKJ') && inv.maturityDate) {
      const purchase = new Date(inv.purchaseDate);
      const maturity = new Date(inv.maturityDate);
      const diffTime = Math.max(0, maturity.getTime() - purchase.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        const rate = Number(inv.annualInterestRate) / 100;
        return Math.round(Number(inv.principalAmount) * (1 + rate * (diffDays / 365.25)));
      }
    }
    return null;
  };

  const getEstimatedPayout = (inv: any) => {
    if (inv.nextPayoutAmount && inv.nextPayoutDate) {
      return {
        amount: inv.nextPayoutAmount,
        date: inv.nextPayoutDate,
        isEstimated: false,
        label: 'Következő kamat'
      };
    }

    const nameUpper = inv.name.toUpperCase();
    const now = new Date();
    
    if (nameUpper.includes('DKJ')) {
      const date = inv.maturityDate ? new Date(inv.maturityDate) : null;
      const amount = getMaturityAmount(inv) || inv.principalAmount;
      return {
        amount,
        date: date ? date.toISOString().split('T')[0] : null,
        isEstimated: true,
        label: 'Lejárati kifizetés'
      };
    }

    if (nameUpper.includes('FIXMÁP') || nameUpper.includes('FIX MÁP')) {
      const principal = getMaturityAmount(inv) || inv.principalAmount;
      const yearlyRate = Number(inv.annualInterestRate) || 7;
      
      const currentYear = now.getFullYear();
      const payoutMonths = [0, 3, 6, 9];
      let nextPayoutDateObj = new Date(currentYear, 6, 23);
      
      for (const m of payoutMonths) {
        const candidate = new Date(currentYear, m, 23);
        if (candidate > now) {
          nextPayoutDateObj = candidate;
          break;
        }
      }
      if (nextPayoutDateObj <= now) {
        nextPayoutDateObj = new Date(currentYear + 1, 0, 23);
      }
      
      const amount = Math.round(Number(principal) * (yearlyRate / 100) / 4);
      
      return {
        amount,
        date: nextPayoutDateObj.toISOString().split('T')[0],
        isEstimated: true,
        label: 'Következő kamat'
      };
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
        if (nextPayoutDateObj <= now) {
          nextPayoutDateObj = new Date(currentYear + 1, payMonth, payDay);
        }
      } else {
        const purchase = new Date(inv.purchaseDate);
        nextPayoutDateObj = new Date(now.getFullYear(), purchase.getMonth(), purchase.getDate());
        if (nextPayoutDateObj <= now) {
          nextPayoutDateObj = new Date(now.getFullYear() + 1, purchase.getMonth(), purchase.getDate());
        }
      }
      
      const amount = Math.round(Number(principal) * (yearlyRate / 100));
      return {
        amount,
        date: nextPayoutDateObj.toISOString().split('T')[0],
        isEstimated: true,
        label: 'Következő kamat'
      };
    }

    if (inv.maturityDate) {
      return {
        amount: getMaturityAmount(inv) || inv.principalAmount,
        date: inv.maturityDate,
        isEstimated: true,
        label: 'Lejárati kifizetés'
      };
    }

    return null;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '.');
  };

  const savingsAccountsTotal = savings
    .filter(acc => acc.count_in_savings !== false)
    .reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s,l)=>s+l.amount, 0), acc.currency), 0);

  const totalInvestmentsValue = investments
    .filter(i => i.countInSavings !== false)
    .reduce((sum, inv) => sum + getInvestmentValue(inv).totalValue, 0);

  const totalSavings = savingsAccountsTotal + totalInvestmentsValue;
  const alerts = [];
  const unpaidBills = bills.filter(b => !b.paidDate && b.dueDate.startsWith(selectedYearMonthPrefix));
  if (unpaidBills.length > 0 && hasPermission('utilities')) {
    alerts.push({ type: 'danger', msg: 'Lejárt rezsi várakozik', icon: <AlertCircle size={14} /> });
  }
  if (utilitySplitEnabled && rezsiBalance !== 0 && hasPermission('utilities')) {
    if (rezsiBalance < 0) {
      alerts.push({ type: 'warning', msg: `Tartozásod van ${partnerName}-nek`, icon: <AlertCircle size={14} /> });
    } else {
      alerts.push({ type: 'warning', msg: `${partnerName} tartozik neked`, icon: <AlertCircle size={14} /> });
    }
  }

  const manualBalance = user?.household?.manualBalance ?? user?.household?.manual_balance ?? 0;

  const unpaidExpenses = (hasPermission('budget') ? monthExpenses.filter(t => !t.paidDate).reduce((s, t) => {
    if (t.isBudget) {
      const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
      return s + Math.max(0, t.amount - spent);
    }
    return s + t.amount;
  }, 0) : 0) + (hasPermission('utilities') ? monthBills.filter(b => !b.paidDate).reduce((s, b) => {
    const isOurPrivate = isAdmin ? (b.splitRule === 'dani-private') : (b.splitRule === 'ildi-private');
    const ourPortion = b.splitRule === 'shared' ? b.total / 2 : (isOurPrivate ? b.total : 0);
    return s + ourPortion;
  }, 0) : 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueExpenses = (hasPermission('budget') ? monthExpenses.filter(t => !t.paidDate && t.dueDate < todayStr).reduce((s, t) => {
    if (t.isBudget) {
      const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
      return s + Math.max(0, t.amount - spent);
    }
    return s + t.amount;
  }, 0) : 0) + (hasPermission('utilities') ? monthBills.filter(b => !b.paidDate && b.dueDate < todayStr).reduce((s, b) => {
    const isOurPrivate = isAdmin ? (b.splitRule === 'dani-private') : (b.splitRule === 'ildi-private');
    const ourPortion = b.splitRule === 'shared' ? b.total / 2 : (isOurPrivate ? b.total : 0);
    return s + ourPortion;
  }, 0) : 0);

  const maradt = Number(manualBalance) - unpaidExpenses;

  const unpaidItemsList = [
    ...(hasPermission('budget') ? monthExpenses.filter(t => !t.paidDate).map(t => ({
      id: t.id as number,
      type: 'expense' as const,
      description: t.description,
      amount: t.isBudget && t.subItems ? t.amount - t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : t.amount,
      dueDate: t.dueDate,
      category: t.category,
      rawItem: t
    })) : []),
    ...(hasPermission('utilities') ? monthBills.filter(b => !b.paidDate).map(b => {
      const isOurPrivate = isAdmin ? (b.splitRule === 'dani-private') : (b.splitRule === 'ildi-private');
      const ourPortion = b.splitRule === 'shared' ? b.total / 2 : (isOurPrivate ? b.total : 0);
      return {
        id: b.id as number,
        type: 'bill' as const,
        description: `${b.type} számla`,
        amount: ourPortion,
        dueDate: b.dueDate,
        category: 'Rezsi',
        rawItem: b
      };
    }) : [])
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // --- AI CACHING LOGIC (Briefly kept for background logic, but UI hidden) ---
  useEffect(() => {
    const currentFingerprint = JSON.stringify({
      totalSavings,
      businessTotal,
      monthlyBalance,
      isOverspentThisMonth,
      rezsiBalance,
      externalDebts,
      unpaidBillsCount: unpaidBills.length,
      heavyConsumption: consumptionData.some(c => c.name === 'Villany' && c.value > 120),
      month: selectedYearMonthPrefix
    });

    const fetchAiAdvice = async () => {
      if (lastAiFingerprint === currentFingerprint && aiDashboardAdvice) return;
      setIsAiLoading(true);
      try {
        const promises = [];
        if (hasPermission('budget')) {
          promises.push(fetchAiWeeklyBriefing());
        }
        if (hasPermission('utilities')) {
          promises.push(fetchAiUtilityAnomalies(selectedYear, selectedMonth));
        }
        await Promise.all(promises);
        if (hasPermission('budget') && aiWeeklyBriefing?.briefing_text) {
          setAiDashboardAdvice(aiWeeklyBriefing.briefing_text, currentFingerprint);
        } else {
          setAiDashboardAdvice('A havi egyenleg stabil.', currentFingerprint);
        }
      } catch (err) { console.error(err); } finally { setIsAiLoading(false); }
    };
    
    const timeoutId = setTimeout(() => { fetchAiAdvice(); }, 1500);
    return () => clearTimeout(timeoutId);
  }, [selectedYearMonthPrefix, totalSavings, businessTotal, incomeReceived, actualSpent, monthlyBalance, isOverspentThisMonth, rezsiBalance, externalDebts, unpaidBills.length, fetchAiWeeklyBriefing, fetchAiUtilityAnomalies, selectedYear, selectedMonth]);

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* HOUSEHOLD HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        {/* Animated gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${greetingGradient} pointer-events-none`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/8 via-transparent to-transparent pointer-events-none" />
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 md:p-8">
          {/* Left: Household identity */}
          <div className="flex items-center gap-5">
            {/* Household icon */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center shadow-xl shadow-brand-primary/10">
                <Home size={28} className="text-brand-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles size={12} className="text-emerald-400" />
              </div>
            </div>
            {/* Household name & greeting */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">Háztartás</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                {householdName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <GreetingIcon size={13} className="text-slate-400" />
                <span className="text-sm text-slate-400 font-medium">
                  {greeting}, <span className="text-slate-200 font-bold">{user?.firstName || 'Gazda'}</span>!
                </span>
              </div>
            </div>
          </div>

          {/* Right: Date + Members */}
          <div className="flex flex-col sm:items-end gap-4">
            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-400 capitalize">{todayFormatted}</span>
            </div>
            {/* Members avatars */}
            {householdMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] font-black text-slate-600 uppercase tracking-widest mr-1">Tagok</span>
                <div className="flex -space-x-2">
                  {householdMembers.slice(0, 4).map((member: any, idx: number) => {
                    const initials = ((member.firstName || '?')[0] + (member.lastName || '?')[0]).toUpperCase();
                    const colors = [
                      'bg-brand-primary/30 text-brand-primary border-brand-primary/40',
                      'bg-purple-500/30 text-purple-300 border-purple-500/40',
                      'bg-emerald-500/30 text-emerald-300 border-emerald-500/40',
                      'bg-amber-500/30 text-amber-300 border-amber-500/40',
                    ];
                    return (
                      <div
                        key={member.id}
                        title={`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                        className={`w-8 h-8 rounded-xl border-2 border-slate-900 flex items-center justify-center text-[0.6rem] font-black ${colors[idx % colors.length]} shadow-lg`}
                      >
                        {initials}
                      </div>
                    );
                  })}
                </div>
                {householdMembers.length > 4 && (
                  <div className="w-8 h-8 rounded-xl border-2 border-slate-900 bg-white/5 flex items-center justify-center text-[0.6rem] font-black text-slate-500 -ml-2">
                    +{householdMembers.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALERTS BANNER */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-4 rounded-2xl border font-bold
              ${a.type === 'danger'
                ? 'bg-red-500/10 text-red-400 border-red-500/25'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
              }
            `}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${a.type === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}
              `}>
                <AlertCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-black">{a.msg}</div>
                <div className={`text-xs font-medium mt-0.5 ${
                  a.type === 'danger' ? 'text-red-500/70' : 'text-amber-500/70'
                }`}>
                  {a.type === 'danger' ? 'Azonnali intézkedés szükséges' : 'Pénzügyi egyenleg rendezésre vár'}
                </div>
              </div>
              {a.type !== 'danger' && (
                <div className={`text-[0.65rem] font-black uppercase tracking-widest px-2 py-1 rounded-lg
                  bg-amber-500/20 text-amber-400 border border-amber-500/20
                `}>
                  Figyelj!
                </div>
              )}
              {a.type === 'danger' && (
                <div className="text-[0.65rem] font-black uppercase tracking-widest px-2 py-1 rounded-lg
                  bg-red-500/20 text-red-400 border border-red-500/20
                ">
                  Sürgős!
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MAIN EXCEL METRICS (Replaces AI Hero) */}
      {hasPermission('budget') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Még fizetendő */}
           <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="text-[0.65rem] font-black text-red-500 uppercase tracking-widest mb-2">Még fizetendő:</div>
              <div className="text-3xl font-black text-red-500 tracking-tight">{formatHUF(unpaidExpenses)}</div>
           </div>

           {/* Van még */}
           <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="text-[0.65rem] font-black text-emerald-500 uppercase tracking-widest mb-2">Van még:</div>
              <div className="text-3xl font-black text-white tracking-tight">{formatHUF(Number(manualBalance))}</div>
           </div>

           {/* Maradt */}
           <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="text-[0.65rem] font-black text-emerald-500 uppercase tracking-widest mb-2">Maradt:</div>
              <div className="text-3xl font-black text-emerald-400 tracking-tight">{formatHUF(maradt)}</div>
           </div>

           {/* Lejárt */}
           <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden border group
             ${overdueExpenses > 0 ? 'bg-red-600 border-red-500' : 'bg-red-500/5 border-white/5'}
           `}>
              <div className={`text-[0.65rem] font-black uppercase tracking-widest mb-2
                ${overdueExpenses > 0 ? 'text-white' : 'text-red-500'}
              `}>
                Lejárt:
              </div>
              <div className={`text-3xl font-black tracking-tight ${overdueExpenses > 0 ? 'text-white' : 'text-red-500'}`}>
                {formatHUF(overdueExpenses)}
              </div>
           </div>
        </div>
      )}

      {/* SECONDARY METRICS */}
      {(() => {
        const activeSecondaryCards = [
          hasPermission('savings') && (
            <div key="savings" className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[110px] hover:bg-white/[0.08] hover:border-white/10 transition-all">
               <div>
                  <div className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Wallet size={10} /> Összes Vagyon</div>
                  <div className="text-base font-black text-slate-300 mt-1">{formatHUF(totalSavings)}</div>
               </div>
               <div className="text-[0.55rem] text-slate-500 font-medium leading-normal mt-2 border-t border-white/5 pt-1.5">Saját számlák és állampapírok napi értéke</div>
            </div>
          ),
          businessEnabled && (
            <div key="business" className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[110px] hover:bg-white/[0.08] hover:border-white/10 transition-all">
               <div>
                  <div className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1.5"><TrendingUp size={10} /> {businessName}</div>
                  <div className="text-base font-black text-blue-400 mt-1">{formatHUF(businessTotal)}</div>
               </div>
               <div className="text-[0.55rem] text-slate-500 font-medium leading-normal mt-2 border-t border-white/5 pt-1.5">A(z) {businessName} tárgyhavi árbevétele</div>
            </div>
          ),
          hasPermission('utilities') && (
            <div key="utilities" className={`border rounded-3xl p-5 flex flex-col justify-between min-h-[110px] transition-all
              ${utilitySplitEnabled
                ? rezsiBalance >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
                : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
              }
            `}>
               {utilitySplitEnabled ? (
                 <>
                   <div>
                      <div className={`text-[0.6rem] font-bold uppercase flex items-center gap-1.5 ${rezsiBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <Users size={10} /> Rezsi Mérleg
                      </div>
                      <div className={`text-base font-black mt-1 ${rezsiBalance >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                        {rezsiBalance >= 0 ? '+' : '-'}{formatHUF(Math.abs(rezsiBalance))}
                      </div>
                   </div>
                   <div className={`text-xs font-black leading-normal mt-2 border-t pt-2 ${rezsiBalance >= 0 ? 'text-emerald-300 border-emerald-500/20' : 'text-red-300 border-red-500/20'}`}>
                     {rezsiBalance > 0
                       ? `${partnerName} tartozik neked`
                       : rezsiBalance < 0
                         ? `Te tartozol ${partnerName}-nek`
                         : 'Rendezve ✓'
                     }
                   </div>
                 </>
               ) : (
                 <>
                   <div>
                      <div className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Droplets size={10} className="text-cyan-400" /> Havi Rezsi</div>
                      <div className="text-base font-black text-slate-300 mt-1">{formatHUF(totalBillsThisMonth)}</div>
                   </div>
                   <div className="text-[0.55rem] text-slate-500 font-medium leading-normal mt-2 border-t border-white/5 pt-1.5">Tárgyhavi közüzemi és egyéb számlák összege</div>
                 </>
               )}
            </div>
          ),
          hasPermission('debts') && (
            <div key="debts" className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[110px] hover:bg-white/[0.08] hover:border-white/10 transition-all">
               <div>
                  <div className="text-[0.6rem] font-bold text-slate-500 uppercase flex items-center gap-1.5"><TrendingDown size={10} /> Tartozások</div>
                  <div className="text-base font-black text-slate-300 mt-1">{formatHUF(externalDebts)}</div>
               </div>
               <div className="text-[0.55rem] text-slate-500 font-medium leading-normal mt-2 border-t border-white/5 pt-1.5">Külső aktív hitelek és kölcsönök egyenlege</div>
            </div>
          )
        ].filter(Boolean);

        if (activeSecondaryCards.length === 0) return null;
        return (
          <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${activeSecondaryCards.length}`}>
            {activeSecondaryCards}
          </div>
        );
      })()}

      {/* ÁLLAMPAPÍROK & KIFIZETÉSEK WIDGET */}
      {hasPermission('savings') && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-emerald-500/10 rounded-3xl p-6 md:p-8 shadow-2xl">
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
              <div>
                 <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                   Állampapírok & Kifizetések (MobilKincstár)
                 </h3>
                 <p className="text-[0.65rem] text-slate-400 mt-1">Aktuális állampapír-portfólió piaci értéke és a következő garantált kifizetések ütemezése</p>
              </div>
              <div className="sm:text-right">
                 <div className="text-[0.6rem] font-bold text-slate-500 uppercase">ÖSSZES PIACI ÉRTÉK</div>
                 <div className="text-lg font-black text-emerald-400">{formatHUF(totalInvestmentsValue)}</div>
              </div>
           </div>

           {investments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                 <div className="text-sm font-black text-slate-500">Nincs még aktív állampapír rögzítve.</div>
                 <Link href="/budget" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 mt-1 underline">
                   Ugrás a befektetések felviteléhez
                 </Link>
              </div>
           ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Bal oldal: Aktuális készletek */}
                 <div className="flex flex-col gap-3">
                    <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider mb-1">Aktív papírok</div>
                    {investments.map(inv => {
                       const { accruedInterest, totalValue } = getInvestmentValue(inv);
                       return (
                          <div key={inv.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all flex justify-between items-center gap-4">
                             <div>
                                <div className="text-sm font-bold text-slate-200">{inv.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className="text-[0.65rem] font-bold text-slate-500 uppercase">{inv.owner}</span>
                                   <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                   <span className="text-[0.65rem] font-bold text-slate-400">Tőke: {formatHUF(inv.principalAmount)}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-sm font-black text-emerald-400">{formatHUF(totalValue)}</div>
                                <div className="text-[0.65rem] font-bold text-slate-500 uppercase mt-0.5">Piaci érték</div>
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 {/* Jobb oldal: Közelgő kifizetések ütemezése */}
                 <div className="flex flex-col gap-3">
                    <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider mb-1">Kifizetési naptár (MobilKincstár ütemezés)</div>
                    {(() => {
                       const payouts = investments
                          .map(inv => {
                             const payout = getEstimatedPayout(inv);
                             if (!payout) return null;
                             return {
                                invName: inv.name,
                                amount: payout.amount,
                                date: payout.date,
                                label: payout.label || 'Kamatkifizetés'
                             };
                          })
                          .filter((p): p is NonNullable<typeof p> => p !== null)
                          .sort((a, b) => {
                             if (!a.date) return 1;
                             if (!b.date) return -1;
                             return new Date(a.date).getTime() - new Date(b.date).getTime();
                          });

                       if (payouts.length === 0) {
                          return <div className="text-xs text-slate-500 italic">Nincs ütemezett kifizetés a közeljövőben.</div>;
                       }

                       return (
                          <div className="flex flex-col gap-3">
                             {payouts.map((p, idx) => (
                                <div key={idx} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex justify-between items-center gap-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                         <Calendar size={16} />
                                      </div>
                                      <div>
                                         <div className="text-sm font-bold text-slate-200">{p.invName}</div>
                                         <div className="text-[0.65rem] font-bold text-slate-500 uppercase mt-0.5">{p.label}</div>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <div className="text-sm font-black text-emerald-400">+{formatHUF(p.amount)}</div>
                                      <div className="text-[0.65rem] font-bold text-slate-400 mt-0.5">{p.date ? p.date.replace(/-/g, '.') : 'Lejáratkor'}</div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       );
                    })()}
                 </div>
              </div>
           )}
        </div>
      )}

      {/* KÖZELGŐ & LEJÁRT BEFIZETÉSEK WIDGET */}
      {hasPermission('budget') && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <AlertCircle size={14} className="text-brand-primary animate-pulse" /> Közelgő és Lejárt Befizetések
                 </h3>
                 <p className="text-[0.65rem] text-slate-400 mt-1">Ebben a hónapban esedékes függő tételeid a költségvetésből és rezsiszámlákból</p>
              </div>
              {unpaidItemsList.length > 0 && (
                 <span className="text-[0.65rem] font-black bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-1 rounded-lg">
                    {unpaidItemsList.length} FÜGGŐ TÉTEL
                 </span>
              )}
           </div>

           {unpaidItemsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                    <Check size={20} />
                 </div>
                 <div className="text-sm font-black text-slate-200">Minden számla és kiadás rendezve!</div>
                 <div className="text-xs text-slate-500 mt-1">Ebben a hónapban nincs több fizetendő tétel. Gratulálunk!</div>
              </div>
           ) : (
              <div className="flex flex-col gap-3 custom-scrollbar max-h-[300px] overflow-y-auto pr-1">
                 {unpaidItemsList.map((item) => {
                    const isOverdueItem = item.dueDate < todayStr;
                    return (
                       <div key={`${item.type}-${item.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all gap-3 sm:gap-4">
                          <div className="flex items-start sm:items-center gap-3">
                             <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 sm:mt-0 ${isOverdueItem ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                             <div>
                                <div className="text-sm font-bold text-slate-200">{item.description}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                   <span className="text-[0.65rem] font-bold text-slate-500 uppercase">{item.category}</span>
                                   <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                   <span className={`text-[0.65rem] font-bold flex items-center gap-1 ${isOverdueItem ? 'text-red-400' : 'text-slate-400'}`}>
                                      <Calendar size={10} /> Határidő: {item.dueDate} {isOverdueItem ? '(Lejárt!)' : ''}
                                   </span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-white/5 pt-3 sm:border-t-0 sm:pt-0">
                             <div className="sm:text-right">
                                <div className="text-sm font-black text-white">{formatHUF(item.amount)}</div>
                             </div>
                             <button
                                onClick={async () => {
                                   const today = new Date().toISOString().split('T')[0];
                                   if (item.type === 'expense') {
                                      await updateTransaction(item.id, { paidDate: today });
                                   } else {
                                      await updateBill(item.id, { paidDate: today });
                                   }
                                }}
                                className="flex items-center justify-center p-2 rounded-xl border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                title="Megjelölés befizetettként"
                             >
                                <Check size={16} />
                             </button>
                          </div>
                       </div>
                    );
                 })}
              </div>
           )}
        </div>
      )}

      {(() => {
         const showChart = businessEnabled;
         const showMeters = hasPermission('meters');

         if (!showChart && !showMeters) return null;

         if (showChart && showMeters) {
            return (
               <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Havi Árbevétel</h3>
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height={250}>
                           <AreaChart data={Object.entries(orders.reduce((acc, o) => {
                               const monthKey = o.date.substring(0, 7);
                               acc[monthKey] = (acc[monthKey] || 0) + o.amount;
                               return acc;
                           }, {} as Record<string, number>)).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([k, v]) => ({ name: k.replace('-', '.'), amount: v }))}>
                              <defs>
                                 <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v/1000}k`} />
                              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, fontSize: '12px', color: 'white' }} formatter={(val) => formatHUF(Number(val ?? 0))} />
                              <Area type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: '#22d3ee', stroke: 'white', strokeWidth: 2 }} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Közműfogyasztás</h3>
                     <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                        {consumptionData.map((m, i) => (
                          <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                             <div className="flex items-center gap-2 mb-2">
                                {m.name.includes('Villany') ? <Zap size={16} className="text-amber-500" /> : m.name.includes('Víz') ? <Droplets size={16} className="text-blue-500" /> : <Flame size={16} className="text-red-500" />}
                                <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">{m.name}</span>
                             </div>
                             <div className="text-2xl font-black text-white">{m.value} <span className="text-xs font-bold text-slate-500">{m.unit}</span></div>
                          </div>
                        ))}
                     </div>
                     <Link href="/meters" className="flex items-center gap-2 mt-6 text-xs font-bold text-brand-primary hover:text-brand-light transition-colors self-start">
                       Mindent látni akarok <ArrowRight size={14} />
                     </Link>
                  </div>
               </div>
            );
         }

         if (showChart) {
            return (
               <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Havi Árbevétel</h3>
                  <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={Object.entries(orders.reduce((acc, o) => {
                            const monthKey = o.date.substring(0, 7);
                            acc[monthKey] = (acc[monthKey] || 0) + o.amount;
                            return acc;
                        }, {} as Record<string, number>)).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([k, v]) => ({ name: k.replace('-', '.'), amount: v }))}>
                           <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                                 <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v/1000}k`} />
                           <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, fontSize: '12px', color: 'white' }} formatter={(val) => formatHUF(Number(val ?? 0))} />
                           <Area type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: '#22d3ee', stroke: 'white', strokeWidth: 2 }} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            );
         }

         return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Közműfogyasztás</h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 content-start">
                  {consumptionData.map((m, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                       <div className="flex items-center gap-2">
                          {m.name.includes('Villany') ? <Zap size={16} className="text-amber-500" /> : m.name.includes('Víz') ? <Droplets size={16} className="text-blue-500" /> : <Flame size={16} className="text-red-500" />}
                          <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">{m.name}</span>
                       </div>
                       <div className="text-2xl font-black text-white">{m.value} <span className="text-xs font-bold text-slate-500">{m.unit}</span></div>
                    </div>
                  ))}
               </div>
               <Link href="/meters" className="flex items-center gap-2 mt-6 text-xs font-bold text-brand-primary hover:text-brand-light transition-colors self-start">
                 Mindent látni akarok <ArrowRight size={14} />
               </Link>
            </div>
         );
      })()}

    </div>
  );
}
