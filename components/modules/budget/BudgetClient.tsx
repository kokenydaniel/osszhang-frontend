'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatHUF, formatDate } from '@/lib/utils';
import { aiFinanceApi } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Folder, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  PlusCircle, 
  Target,
  History,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Zap,
  Bot
} from 'lucide-react';

export default function BudgetClient() {
  const { 
    transactions, addTransaction, deleteTransaction, updateTransaction, addSubItem, deleteSubItem,
    savings, addSavingsAccount, updateSavingsAccount, deleteSavingsAccount, addLedgerEntry, deleteLedgerEntry,
    bills, debts, exchangeRates, refreshRates,
    aiOverspend, aiCashflowForecast, aiSavingsPlan, aiDebtPlan, aiMeta,
    fetchAiOverspend, fetchAiCashflowForecast, fetchAiSavingsPlan, fetchAiDebtPlan,
    selectedMonth, selectedYear, clonePreviousMonth,
    categories
  } = useAppStore();

  React.useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  React.useEffect(() => {
    fetchAiOverspend(selectedYear, selectedMonth);
  }, [fetchAiOverspend, selectedMonth, selectedYear]);

  const convertToHUF = (amount: number, currency: string) => {
    const rate = exchangeRates[currency] || 1;
    return amount * rate;
  };

  const formatCurrencyAmount = (amount: number, currency: string) => {
    if (currency === 'HUF') return formatHUF(amount);

    const maxFractionDigits = currency === 'BTC' || currency === 'ETH' ? 8 : 2;
    return `${amount.toLocaleString('hu-HU', { maximumFractionDigits: maxFractionDigits })} ${currency}`;
  };

  const [activeTab, setActiveTab] = useState<'cashflow' | 'savings'>('cashflow');

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editTxId, setEditTxId] = useState<number | null>(null);
  const [txType, setTxType] = useState<'expense' | 'income'>('income');
  const [txCat, setTxCat] = useState(categories[0] || '');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDue, setTxDue] = useState(new Date().toISOString().split('T')[0]);
  const [txIsBudget, setTxIsBudget] = useState(false);
  const [txIsReserve, setTxIsReserve] = useState(false);
  const [txPaidDate, setTxPaidDate] = useState<string | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [activeTxId, setActiveTxId] = useState<number | null>(null);
  const [subReason, setSubReason] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDate, setSubDate] = useState(new Date().toISOString().split('T')[0]);

  const [isNewSavingsModalOpen, setIsNewSavingsModalOpen] = useState(false);
  const [savInst, setSavInst] = useState('');
  const [savCurr, setSavCurr] = useState('HUF');
  const [savOwner, setSavOwner] = useState('Közös');
  const [goalName, setGoalName] = useState('Vésztartalék');
  const [goalAmount, setGoalAmount] = useState('1500000');
  const [goalDate, setGoalDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]);
  const [debtStrategy, setDebtStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedSavings, setSelectedSavings] = useState<number | null>(null);
  const [ledgerType, setLedgerType] = useState<'deposit' | 'withdraw'>('deposit');
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerReason, setLedgerReason] = useState('');
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().split('T')[0]);

  const [manualBalance, setManualBalance] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('penzpilot_manual_balance') || '0';
    }
    return '0';
  });

  const handleManualBalanceChange = (val: string) => {
    setManualBalance(val);
    localStorage.setItem('penzpilot_manual_balance', val);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type: txType,
      description: txDesc,
      category: txCat,
      amount: Number(txAmount),
      dueDate: txDue,
      isBudget: txIsBudget,
      isReserve: txIsReserve,
      paidDate: txPaidDate
    };
    if (editTxId) updateTransaction(editTxId, data);
    else addTransaction(data);
    setIsTxModalOpen(false);
  };

  const handleAutoCategory = async () => {
    if (!txDesc.trim()) return;
    setIsCategoryLoading(true);
    try {
      const res = await aiFinanceApi.autoCategorizeTransaction({
        description: txDesc,
        type: txType,
        amount: txAmount ? Number(txAmount) : undefined,
        candidate_categories: categories
      });
      const category = res.data?.data?.category;
      if (category) setTxCat(category);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const openTxForm = (tx?: any, defaultType: 'income' | 'expense' = 'expense') => {
    if (tx) {
      setEditTxId(tx.id); setTxType(tx.type); setTxCat(tx.category);
      setTxDesc(tx.description); setTxAmount(tx.amount.toString());
      setTxDue(tx.dueDate); setTxIsBudget(tx.isBudget || false);
      setTxIsReserve(tx.isReserve || false);
      setTxPaidDate(tx.paidDate || null);
    } else {
      setEditTxId(null); setTxType(defaultType); setTxCat(categories[0]);
      setTxDesc(''); setTxAmount(''); setTxDue(new Date().toISOString().split('T')[0]);
      setTxIsBudget(false); setTxIsReserve(false); setTxPaidDate(null);
    }
    setIsTxModalOpen(true);
  };

  const handleSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSavingsAccount({ 
      institution: savInst, 
      currency: savCurr, 
      owner: savOwner,
      count_in_savings: true
    });
    setIsNewSavingsModalOpen(false);
    setSavInst('');
  };

  const selectedYearMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const allMonthTransactions = transactions.filter(t => t.dueDate.startsWith(selectedYearMonth));
  const reserves = allMonthTransactions.filter(t => t.isReserve);
  const incomes = allMonthTransactions.filter(t => t.type === 'income' && !t.isReserve);
  const expenses = allMonthTransactions.filter(t => t.type === 'expense' && !t.isReserve);
  const monthlyBills = bills.filter(b => b.dueDate.startsWith(selectedYearMonth));

  const totalProjectedIncome = incomes.reduce((s,t) => s + t.amount, 0);
  const totalIncomeReceived = incomes.filter(t => !!t.paidDate).reduce((s,t) => s + t.amount, 0);
  
  const totalActualSpent = expenses.reduce((s,t) => {
     if (t.isBudget && t.subItems && t.subItems.length > 0) {
       return s + t.subItems.reduce((acc: number, si: any) => acc + Math.abs(si.amount), 0);
     }
     return s + (t.paidDate ? t.amount : 0);
  }, 0) + monthlyBills.filter(b => !!b.paidDate).reduce((s,b) => {
     const ourPortion = b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
     return s + ourPortion;
  }, 0);

  const totalProjectedExpense = expenses.reduce((s,t) => s + t.amount, 0) + monthlyBills.reduce((s,b) => {
     const ourPortion = b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
     return s + ourPortion;
  }, 0);

  // --- LIQUIDITY CALCULATION ---
  const currentTotalLiquidAssets = savings
    .filter(s => s.count_in_savings !== false)
    .reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s, l) => s + l.amount, 0), acc.currency), 0);

  const unpaidExpenses = expenses.filter(t => !t.paidDate).reduce((s, t) => {
     if (t.isBudget) {
       const spent = t.subItems ? t.subItems.reduce((acc: number, si: any) => acc + Math.abs(si.amount), 0) : 0;
       return s + Math.max(0, t.amount - spent);
     }
     return s + t.amount;
  }, 0) + 
                         monthlyBills.filter(b => !b.paidDate).reduce((s, b) => {
                            const ourPortion = b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
                            return s + ourPortion;
                         }, 0);

  const unpaidIncome = incomes.filter(t => !t.paidDate).reduce((s, t) => s + t.amount, 0);

  const projectedFinalLiquidAssets = Number(manualBalance) - unpaidExpenses;

  const today = new Date().toISOString().split('T')[0];
  const overdueExpenses = expenses.filter(t => !t.paidDate && t.dueDate < today).reduce((s, t) => s + t.amount, 0) + 
                          monthlyBills.filter(b => !b.paidDate && b.dueDate < today).reduce((s, b) => {
                             const ourPortion = b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
                             return s + ourPortion;
                          }, 0);

  const allExpenseCategories = Array.from(new Set([...categories, ...expenses.map(e => e.category || 'Egyéb')]));
  const categoryData = allExpenseCategories.map(name => {
     const amt = expenses.filter(e => (e.category || 'Egyéb') === name).reduce((s,e) => s+e.amount, 0);
     const billAmt = name === 'Rezsi' ? monthlyBills.reduce((s,b) => s + (b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0), 0) : 0;
     return { name, value: amt + billAmt };
  }).filter(c => c.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6'];

  const renderTable = (items: any[], title: string, type: 'income' | 'expense') => {
    const allTableCategories = Array.from(new Set([...categories, ...items.map((i: any) => i.category || 'Egyéb')]));
    const grouped = allTableCategories.reduce((acc, cat) => {
       let filtered = items.filter(i => (i.category || 'Egyéb') === cat);
       
       if (cat === 'Rezsi' && type === 'expense') {
          const billItems = monthlyBills.map(b => ({
             id: `bill-${b.id}`,
             description: b.type,
             category: 'Rezsi',
             amount: b.splitRule === 'shared' ? b.total / 2 : (b.splitRule === 'dani-private' ? b.total : 0),
             dueDate: b.dueDate,
             paidDate: b.paidDate,
             isBill: true
          })).filter(b => b.amount > 0);
          filtered = [...filtered, ...billItems];
       }

       if (filtered.length > 0) acc[cat] = filtered;
       return acc;
    }, {} as Record<string, any[]>);

    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden mb-6">
        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">{title}</h3>
           <button 
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors" 
             onClick={() => openTxForm(null, type)}
           >
             <Plus size={14} /> Új tétel
           </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[0.65rem] uppercase tracking-widest text-slate-500 font-black">
                <th className="p-3 pl-5 w-2/5">Megnevezés</th>
                <th className="p-3">Összeg</th>
                <th className="p-3">Dátum</th>
                <th className="p-3 text-center">Státusz</th>
                <th className="p-3 pr-5 w-24 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allTableCategories.map(cat => {
                if (!grouped[cat]) return null;
                return (
                  <React.Fragment key={cat}>
                    <tr className="bg-white/[0.03]">
                      <td colSpan={5} className="py-2 px-5 text-[0.65rem] font-black text-brand-primary uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Folder size={12} /> {cat}
                        </div>
                      </td>
                    </tr>
                    {grouped[cat].map((t: any) => {
                      const spent = t.isBudget && t.subItems ? t.subItems.reduce((acc: number, si: any) => acc + Math.abs(si.amount), 0) : 0;
                      const remaining = t.amount - spent;
                      const progress = t.isBudget ? Math.min(100, (spent / t.amount) * 100) : 0;

                      return (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-3 pl-5">
                            <div className="font-bold text-sm text-slate-200">{t.description}</div>
                            {t.isBudget && (
                              <div 
                                className="mt-1.5 cursor-pointer group/budget" 
                                onClick={()=>{setActiveTxId(t.id); setIsLedgerModalOpen(true);}}
                              >
                                <div className="flex items-center gap-1.5 text-[0.65rem] font-black text-brand-primary group-hover/budget:text-brand-light transition-colors uppercase tracking-wider">
                                   <History size={10} /> Rögzített tételek ({t.subItems?.length || 0})
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${progress > 90 ? 'bg-red-500' : 'bg-brand-primary'}`} 
                                    style={{ width: `${progress}%` }} 
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className={`font-black text-sm ${type === 'income' ? 'text-green-500' : 'text-slate-200'}`}>
                              {formatHUF(t.amount)}
                            </div>
                            {t.isBudget && (
                              <div className="text-[0.65rem] font-medium text-slate-500 mt-1">
                                Elköltve: {formatHUF(spent)} | <span className={`${remaining < 0 ? 'text-red-500 font-bold' : ''}`}>Maradt: {formatHUF(remaining)}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-xs font-medium text-slate-400">{formatDate(t.dueDate)}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => updateTransaction(t.id, { paidDate: t.paidDate ? null : new Date().toISOString().split('T')[0] })}
                              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.65rem] font-black border transition-colors whitespace-nowrap min-w-[90px]
                                ${t.paidDate ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'}
                              `}
                            >
                              {t.paidDate ? <><CheckCircle size={10} /> {formatDate(t.paidDate)}</> : <><Clock size={10} /> FÜGGŐBEN</>}
                            </button>
                          </td>
                          <td className="p-3 pr-5 text-right">
                            <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                              <button onClick={() => openTxForm(t)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                              <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-white/10">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('cashflow')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border
              ${activeTab === 'cashflow' ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <Wallet size={16} /> Cashflow
          </button>
          <button 
            onClick={() => setActiveTab('savings')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border
              ${activeTab === 'savings' ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <PiggyBank size={16} /> Széf
          </button>
        </div>
        {activeTab === 'cashflow' && (
          <div className="flex gap-2">
             <button 
               onClick={() => clonePreviousMonth(selectedMonth, selectedYear)} 
               className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
             >
               Múlt havi klónozása
             </button>
             <button 
               onClick={() => openTxForm(null, 'expense')} 
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20"
             >
               <Plus size={14} /> Új Kiadás
             </button>
          </div>
        )}
      </div>

      {activeTab === 'cashflow' && (
        <div className="flex flex-col gap-6">
          {aiOverspend && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-lg col-span-1">
                <div className="text-[0.65rem] font-black text-brand-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Bot size={14} /> AI túlköltés elemző
                </div>
                <div className="text-sm text-slate-300 mb-1">
                  Státusz: <b className={aiOverspend?.status === 'overspent' ? 'text-red-500' : 'text-green-500'}>{aiOverspend?.status === 'overspent' ? 'Túlköltés' : 'Rendben'}</b>
                </div>
                {typeof aiOverspend?.overspend_amount === 'number' && (
                  <div className="text-2xl font-black text-white">{formatHUF(aiOverspend.overspend_amount)}</div>
                )}
                {!!aiMeta?.overspend?.fallback_used && (
                  <div className="mt-2 text-[0.65rem] text-amber-500 font-bold">Fallback elemzés</div>
                )}
              </div>
              {!!aiOverspend?.top_drivers?.length && (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-lg col-span-1 md:col-span-2">
                  <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-2">Főbb kiadási driverek</div>
                  <div className="flex flex-wrap gap-2">
                    {aiOverspend.top_drivers.map((d: any) => (
                      <div key={d.category} className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-xs">
                        <span className="text-slate-400">{d.category}:</span> <span className="text-white font-bold">{formatHUF(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAIN DASHBOARD SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Még fizetendő */}
             <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                <div className="text-[0.65rem] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                   Még fizetendő:
                </div>
                <div className="text-3xl font-black text-red-500 tracking-tight">{formatHUF(unpaidExpenses)}</div>
             </div>

             {/* Van még */}
             <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                <div className="text-[0.65rem] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center justify-between gap-1.5">
                   Van még:
                   <span className="text-[0.6rem] font-medium opacity-50 lowercase tracking-normal">Kattints a módosításhoz</span>
                </div>
                <input 
                  type="number"
                  value={manualBalance}
                  onChange={(e) => handleManualBalanceChange(e.target.value)}
                  className="w-full bg-transparent text-3xl font-black text-white tracking-tight outline-none border-b border-transparent focus:border-emerald-500/30 transition-all p-0"
                  placeholder="0"
                />
             </div>

             {/* Maradt */}
             <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                <div className="text-[0.65rem] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                   Maradt:
                </div>
                <div className="text-3xl font-black text-emerald-400 tracking-tight">{formatHUF(projectedFinalLiquidAssets)}</div>
             </div>

             {/* Lejárt */}
             <div className={`rounded-2xl p-6 shadow-lg relative overflow-hidden border group
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl overflow-hidden">
                <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-4">Költségvetés összefoglaló</div>
                <div className="flex flex-col">
                  {categoryData.map((c, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-xs font-bold text-slate-400">{c.name}</span>
                      <span className="text-sm font-black text-white">{formatHUF(c.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-white/10">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Összesen</span>
                    <span className="text-lg font-black text-brand-primary">{formatHUF(totalProjectedExpense)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-6">
               <div className="bg-white/5 border border-white/5 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col">
                    <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1">Tervezett havi keret</div>
                    <div className="text-lg font-black text-slate-200">{formatHUF(totalProjectedExpense)}</div>
                  </div>
                  <div className="flex flex-col border-l border-white/5 pl-4">
                    <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1">Már kifizetve</div>
                    <div className="text-lg font-black text-slate-200">{formatHUF(totalActualSpent)}</div>
                  </div>
                  <div className="flex flex-col border-l border-white/5 pl-4">
                    <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1">Befolyt bevétel</div>
                    <div className="text-lg font-black text-green-500">{formatHUF(totalIncomeReceived)}</div>
                  </div>
                  <div className="flex flex-col border-l border-white/5 pl-4">
                    <div className="text-[0.6rem] font-bold text-slate-500 uppercase mb-1">Havi egyenleg</div>
                    <div className={`text-lg font-black ${(totalIncomeReceived - totalActualSpent) < 0 ? 'text-red-500' : 'text-brand-primary'}`}>
                      {formatHUF(totalIncomeReceived - totalActualSpent)}
                    </div>
                  </div>
               </div>

               <div className="flex flex-col">
                  {renderTable(incomes, 'Bevételek', 'income')}
                  {renderTable(expenses, 'Kiadások', 'expense')}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'savings' && (() => {
        const personalSavings = savings.filter(s => s.owner !== 'Little Loom');
        const wifeSavings = savings.filter(s => s.owner === 'Little Loom');
        
        const sumPersonal = personalSavings.filter(s => s.count_in_savings !== false).reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s,l)=>s+l.amount, 0), acc.currency), 0);
        const sumWife = wifeSavings.filter(s => s.count_in_savings !== false).reduce((sum, acc) => sum + convertToHUF(acc.ledger.reduce((s,l)=>s+l.amount, 0), acc.currency), 0);
        
        return (
          <div className="flex flex-col gap-6">
             {/* SAVINGS SUMMARY */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                   <div className="text-[0.65rem] font-black text-blue-500 uppercase tracking-widest mb-2">Saját Megtakarítás</div>
                   <div className="text-3xl font-black text-blue-500 tracking-tight">{formatHUF(sumPersonal)}</div>
                </div>
                <div className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                   <div className="text-[0.65rem] font-black text-pink-500 uppercase tracking-widest mb-2">Little Loom (Szandi)</div>
                   <div className="text-3xl font-black text-pink-500 tracking-tight">{formatHUF(sumWife)}</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                   <div className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2">Közös Tartalék</div>
                   <div className="text-3xl font-black text-white tracking-tight">{formatHUF(sumPersonal + sumWife)}</div>
                </div>
             </div>

             <div className="flex flex-wrap justify-between items-center gap-4 mt-2">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <PiggyBank size={24} className="text-brand-primary" /> Számlák és Alszerkezetek
                </h2>
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20" 
                  onClick={() => setIsNewSavingsModalOpen(true)}
                >
                  <PlusCircle size={16} /> Új Számla
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {savings.map(acc => {
                  const balance = acc.ledger.reduce((s, l) => s + l.amount, 0);
                  return (
                    <div 
                      key={acc.id} 
                      className={`bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col transition-all duration-300
                        ${acc.count_in_savings === false ? 'opacity-50 hover:opacity-75 grayscale-[0.3]' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <div className="text-lg font-black text-white mb-0.5">{acc.institution}</div>
                            <div className="text-xs font-bold text-slate-500">{acc.owner} • {acc.currency}</div>
                         </div>
                         <button 
                           onClick={() => deleteSavingsAccount(acc.id)} 
                           className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                      <div className="text-2xl font-black text-brand-primary mb-1 tracking-tight">
                         {formatCurrencyAmount(balance, acc.currency)}
                      </div>
                      {acc.currency !== 'HUF' ? (
                        <div className="text-xs font-medium text-slate-400 mb-4">
                          ~ {formatHUF(convertToHUF(balance, acc.currency))} <span className="opacity-50">(azonnali arfolyam)</span>
                        </div>
                      ) : (
                        <div className="mb-4"></div>
                      )}
                      
                      <div className="mt-auto flex flex-col gap-4">
                        <label className="flex items-center gap-3 text-xs font-bold text-slate-300 cursor-pointer select-none group">
                          <div
                            onClick={(e) => { e.preventDefault(); updateSavingsAccount(acc.id, { count_in_savings: !acc.count_in_savings }); }}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 shrink-0
                              ${acc.count_in_savings !== false ? 'bg-brand-primary' : 'bg-white/10'}
                            `}
                          >
                            <div 
                              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-md
                                ${acc.count_in_savings !== false ? 'left-[22px]' : 'left-0.5'}
                              `}
                            />
                          </div>
                          <span className="group-hover:text-white transition-colors">Beleszámít a megtakarításba</span>
                        </label>
                        <button 
                          className="w-full px-4 py-2 rounded-xl text-sm font-bold border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-colors" 
                          onClick={() => { setSelectedSavings(acc.id); setIsLedgerModalOpen(true); }}
                        >
                          Történet / Módosítás
                        </button>
                      </div>
                    </div>
                  )
                })}
             </div>

             <div className="bg-slate-900/50 backdrop-blur-xl border border-brand-primary/20 bg-brand-primary/5 rounded-3xl p-5 md:p-6 shadow-2xl mt-4">
               <h4 className="text-[0.65rem] font-black uppercase text-brand-primary tracking-widest mb-4 flex items-center gap-1.5">
                 <Bot size={14} /> AI Széf cél-ajánló
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                 <div className="flex flex-col gap-1.5">
                   <label className="text-[0.65rem] font-bold text-slate-500 uppercase">Cél neve</label>
                   <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Vésztartalék" />
                 </div>
                 <div className="flex flex-col gap-1.5">
                   <label className="text-[0.65rem] font-bold text-slate-500 uppercase">Cél összeg (Ft)</label>
                   <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="1500000" />
                 </div>
                 <div className="flex flex-col gap-1.5">
                   <label className="text-[0.65rem] font-bold text-slate-500 uppercase">Céldátum</label>
                   <DatePicker value={goalDate} onChange={setGoalDate} />
                 </div>
                 <button 
                   className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20 h-[42px]" 
                   onClick={() => fetchAiSavingsPlan({ goals: [{ name: goalName, target_amount: Number(goalAmount), target_date: goalDate, priority: 1 }] })}
                 >
                   Ajánlás Kérése
                 </button>
               </div>
               {!!aiSavingsPlan?.monthly_allocation_plan?.length && (
                 <div className="mt-6 flex flex-col gap-2">
                   {aiSavingsPlan.monthly_allocation_plan.map((row: any) => (
                     <div key={row.goal} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                       <span className="text-sm font-bold text-slate-200">{row.goal}</span>
                       <span className="text-sm font-black text-brand-primary">{formatHUF(row.monthly_allocation)} <span className="text-xs text-slate-500 font-medium">/ hó</span></span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        );
      })()}

      {/* TRANSACTION MODAL */}
      <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title={editTxId ? 'Tétel szerkesztése' : 'Új tétel hozzáadása'}>
         <form onSubmit={handleTxSubmit} className="flex flex-col gap-5">
            <div className="flex gap-3">
               <button type="button" onClick={() => setTxType('income')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${txType === 'income' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}>Bevétel</button>
               <button type="button" onClick={() => setTxType('expense')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${txType === 'expense' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}>Kiadás</button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Leírás</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white" placeholder="pl. Heti bevásárlás" value={txDesc} onChange={e=>setTxDesc(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Kategória</label>
              <div className="flex gap-2">
                <select className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white appearance-none" value={txCat} onChange={e=>setTxCat(e.target.value)}>
                  {categories.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                </select>
                <button type="button" className="px-3 rounded-xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-bold hover:bg-brand-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap" onClick={handleAutoCategory} disabled={isCategoryLoading || !txDesc.trim()}>
                  {isCategoryLoading ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
                  {isCategoryLoading ? 'AI...' : 'Auto'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Összeg (Ft)</label>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white" placeholder="0" value={txAmount} onChange={e=>setTxAmount(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Dátum</label>
                <DatePicker value={txDue} onChange={setTxDue} />
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              {txType === 'expense' && (
                <label className="flex items-center gap-3 text-sm font-bold text-slate-300 cursor-pointer group">
                   <input type="checkbox" className="w-4 h-4 accent-brand-primary border-white/20" checked={txIsBudget} onChange={e=>setTxIsBudget(e.target.checked)} />
                   <span className="group-hover:text-white transition-colors">Saját keret alapú (Ledger)</span>
                </label>
              )}
              {txType === 'income' && (
                <label className="flex items-center gap-3 text-sm font-bold text-slate-300 cursor-pointer group">
                   <input type="checkbox" className="w-4 h-4 accent-brand-primary border-white/20" checked={txIsReserve} onChange={e=>setTxIsReserve(e.target.checked)} />
                   <span className="group-hover:text-white transition-colors flex items-center gap-1.5"><PiggyBank size={16} className="text-amber-500" /> Tartalék (nem cashflow)</span>
                </label>
              )}
              {txType !== 'expense' && txType !== 'income' && <span className="text-xs text-slate-500 italic">Válassz típust a további opciókhoz.</span>}
            </div>

            <div className="flex gap-3 mt-2">
               <button type="button" className="flex-1 py-3 rounded-xl text-sm font-bold bg-transparent hover:bg-white/5 text-slate-300 transition-colors" onClick={() => setIsTxModalOpen(false)}>Mégse</button>
               <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20">Mentés</button>
            </div>
         </form>
      </Modal>

      {/* LEDGER MODAL */}
      <Modal 
        isOpen={isLedgerModalOpen} 
        onClose={() => { setIsLedgerModalOpen(false); setActiveTxId(null); setSelectedSavings(null); }} 
        title={activeTxId ? 'Tételek rögzítése' : 'Módosítás / Történet'}
      >
         <div className="flex flex-col gap-5">
            {!activeTxId && (
               <div className="flex gap-3">
                  <button onClick={() => setLedgerType('deposit')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${ledgerType === 'deposit' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}>Befizetés</button>
                  <button onClick={() => setLedgerType('withdraw')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${ledgerType === 'withdraw' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'}`}>Kivétel</button>
               </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Összeg</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white" placeholder="0" value={ledgerAmount} onChange={e=>setLedgerAmount(e.target.value)} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Megjegyzés</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white" placeholder="pl. Utalás a közösbe" value={ledgerReason} onChange={e=>setLedgerReason(e.target.value)} />
            </div>

            <button className="py-3 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20 mt-2" onClick={() => {
               if(!selectedSavings && !activeTxId) return;
               const amt = activeTxId ? -Math.abs(Number(ledgerAmount)) : (ledgerType === 'deposit' ? Number(ledgerAmount) : -Number(ledgerAmount));
               if(selectedSavings) addLedgerEntry(selectedSavings, { date: new Date().toISOString().split('T')[0], amount: amt, reason: ledgerReason });
               if(activeTxId) addSubItem(activeTxId, { date: new Date().toISOString().split('T')[0], amount: amt, reason: ledgerReason });
               setLedgerAmount(''); setLedgerReason('');
            }}>Tétel rögzítése</button>

            <div className="mt-4 border-t border-white/10 pt-5 flex flex-col max-h-[300px] overflow-hidden">
               <h4 className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-3 shrink-0">Korábbi tételek</h4>
               <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 pb-2">
                  {(selectedSavings ? savings.find(s=>s.id===selectedSavings)?.ledger : transactions.find(t=>t.id===activeTxId)?.subItems)
                    ?.slice().reverse().map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                       <div>
                          <div className="text-sm font-bold text-white mb-0.5">{item.reason}</div>
                          <div className="text-[0.65rem] font-medium text-slate-500">{formatDate(item.date)}</div>
                       </div>
                       <div className={`text-base font-black ${item.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {item.amount >= 0 ? '+' : ''}{formatHUF(item.amount)}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </Modal>

      {/* NEW SAVINGS MODAL */}
      <Modal isOpen={isNewSavingsModalOpen} onClose={() => setIsNewSavingsModalOpen(false)} title="Új számla hozzáadása">
         <form onSubmit={handleSavingsSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
               <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Intézmény / Megnevezés</label>
               <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white" placeholder="pl. Revolut, Széf, OTP" value={savInst} onChange={e=>setSavInst(e.target.value)} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1.5">
                  <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Pénznem</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white appearance-none" value={savCurr} onChange={e=>setSavCurr(e.target.value)}>
                     <option value="HUF" className="bg-slate-800">HUF</option>
                     <option value="EUR" className="bg-slate-800">EUR</option>
                     <option value="USD" className="bg-slate-800">USD</option>
                     <option value="BTC" className="bg-slate-800">BTC</option>
                     <option value="ETH" className="bg-slate-800">ETH</option>
                  </select>
               </div>
               <div className="flex flex-col gap-1.5">
                  <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Tulajdonos</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary outline-none text-white" value={savOwner} onChange={e=>setSavOwner(e.target.value)} />
               </div>
            </div>

            <div className="flex gap-3 mt-2">
               <button type="button" className="flex-1 py-3 rounded-xl text-sm font-bold bg-transparent hover:bg-white/5 text-slate-300 transition-colors" onClick={() => setIsNewSavingsModalOpen(false)}>Mégse</button>
               <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20">Létrehozás</button>
            </div>
         </form>
      </Modal>

    </div>
  );
}
