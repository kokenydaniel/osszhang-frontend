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
import React, { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';

export default function DashboardClient() {
  const { user, aiDashboardAdvice, lastAiFingerprint, setAiDashboardAdvice } = useAuthStore();
  const { transactions, updateTransaction, aiWeeklyBriefing, fetchAiWeeklyBriefing } = useBudgetStore();
  const { bills, updateBill, aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  const { savings } = useSavingsStore();
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
      const ourPortion = b.splitRule === 'shared' ? b.total / 2 : (b.splitRule === 'dani-private' ? b.total : 0);
      return sum + ourPortion;
    }, 0);

  const monthlyBalance = incomeReceived - actualSpent;
  const isOverspentThisMonth = monthlyBalance < 0;

  // --- UTILITIES & DEBTS ---
  let ildiOwesUs = 0;
  let weOweIldi = 0;
  bills.forEach(b => {
    if (b.paidBy === 'Mi') {
       if (b.splitRule === 'shared') ildiOwesUs += b.total / 2;
       if (b.splitRule === 'ildi-private') ildiOwesUs += b.total;
    } else if (b.paidBy === 'Ildi') {
       if (b.splitRule === 'shared') weOweIldi += b.total / 2;
       if (b.splitRule === 'dani-private') weOweIldi += b.total;
    }
  });
  const rezsiBalance = ildiOwesUs - weOweIldi;
  const externalDebts = debts.reduce((s, d) => s + (d.targetAmount - d.paidAmount), 0);

  // --- CONSUMPTION ---
  const consumptionData = meters.map(m => {
    const reading = m.readings.find(r => r.month === selectedMonth && r.year === selectedYear);
    return { name: m.name, value: reading?.consumption || 0, unit: m.unit };
  });

  const totalSavings = savings
    .filter(acc => acc.count_in_savings)
    .reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s,l)=>s+l.amount, 0), acc.currency), 0);
  const alerts = [];
  const unpaidBills = bills.filter(b => !b.paidDate && b.dueDate.startsWith(selectedYearMonthPrefix));
  if (unpaidBills.length > 0) alerts.push({ type: 'danger', msg: 'Lejárt rezsi várakozik', icon: <AlertCircle size={14} /> });
  if (rezsiBalance < 0) alerts.push({ type: 'warning', msg: 'Ildi tartozás aktív', icon: <Info size={14} /> });

  const [manualBalance, setManualBalance] = useState<string>('0');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setManualBalance(localStorage.getItem('penzpilot_manual_balance') || '0');
    }
  }, []);

  const unpaidExpenses = monthExpenses.filter(t => !t.paidDate).reduce((s, t) => {
    if (t.isBudget) {
      const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
      return s + Math.max(0, t.amount - spent);
    }
    return s + t.amount;
  }, 0) + monthBills.filter(b => !b.paidDate).reduce((s, b) => {
    const ourPortion = b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
    return s + ourPortion;
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueExpenses = monthExpenses.filter(t => !t.paidDate && t.dueDate < todayStr).reduce((s, t) => {
    if (t.isBudget) {
      const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
      return s + Math.max(0, t.amount - spent);
    }
    return s + t.amount;
  }, 0) + monthBills.filter(b => !b.paidDate && b.dueDate < todayStr).reduce((s, b) => {
    const ourPortion = b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
    return s + ourPortion;
  }, 0);

  const maradt = Number(manualBalance) - unpaidExpenses;

  const unpaidItemsList = [
    ...monthExpenses.filter(t => !t.paidDate).map(t => ({
      id: t.id as number,
      type: 'expense' as const,
      description: t.description,
      amount: t.isBudget && t.subItems ? t.amount - t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : t.amount,
      dueDate: t.dueDate,
      category: t.category,
      rawItem: t
    })),
    ...monthBills.filter(b => !b.paidDate).map(b => {
      const ourPortion = b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
      return {
        id: b.id as number,
        type: 'bill' as const,
        description: `${b.type} számla`,
        amount: ourPortion,
        dueDate: b.dueDate,
        category: 'Rezsi',
        rawItem: b
      };
    })
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
        await Promise.all([
          fetchAiWeeklyBriefing(),
          fetchAiUtilityAnomalies(selectedYear, selectedMonth)
        ]);
        if (aiWeeklyBriefing?.briefing_text) {
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
      
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <Rocket size={24} className="text-brand-primary" /> Vezérlőterem
          </h1>
          <p className="text-slate-400 text-sm">Összesített háztartási és üzleti intelligencia</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border
              ${a.type === 'danger' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}
            `}>
              {a.icon} {a.msg}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN EXCEL METRICS (Replaces AI Hero) */}
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

      {/* SECONDARY METRICS (Old KPI Row but smaller/moved) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col">
            <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5"><Wallet size={10} /> Összes Vagyon</div>
            <div className="text-base font-black text-slate-300">{formatHUF(totalSavings)}</div>
         </div>
         <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col">
            <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5"><TrendingUp size={10} /> Little Loom</div>
            <div className="text-base font-black text-blue-400">{formatHUF(businessTotal)}</div>
         </div>
         <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col">
            <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5"><Users size={10} /> Rezsi Mérleg</div>
            <div className={`text-base font-black ${rezsiBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatHUF(Math.abs(rezsiBalance))}</div>
         </div>
         <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col">
            <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5"><TrendingDown size={10} /> Tartozások</div>
            <div className="text-base font-black text-slate-300">{formatHUF(externalDebts)}</div>
         </div>
      </div>

      {/* KÖZELGŐ & LEJÁRT BEFIZETÉSEK WIDGET */}
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
                     <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all gap-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOverdueItem ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                           <div>
                              <div className="text-sm font-bold text-slate-200">{item.description}</div>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[0.65rem] font-bold text-slate-500 uppercase">{item.category}</span>
                                 <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                 <span className={`text-[0.65rem] font-bold flex items-center gap-1 ${isOverdueItem ? 'text-red-400' : 'text-slate-400'}`}>
                                    <Calendar size={10} /> Határidő: {item.dueDate} {isOverdueItem ? '(Lejárt!)' : ''}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
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
                              className={`flex items-center justify-center p-2 rounded-xl border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all`}
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

    </div>
  );
}
