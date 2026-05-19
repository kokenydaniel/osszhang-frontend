'use client';

import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatHUF, formatDate } from '@/utils';
import { UtilitySplitRule, UtilityBill, AiMeta } from '@/types';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { 
  Home, 
  Receipt, 
  Plus, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  User, 
  Edit3, 
  Trash2, 
  Clock,
  ArrowRightLeft,
  Info,
  UserCheck
} from 'lucide-react';

export default function UtilitiesClient() {
  const { bills, addBill, deleteBill, updateBill, aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isReader = user?.role === 'reader';
  const utilitySplitEnabled = user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? true;
  const myName = user?.firstName || 'Mi';
  const partnerId = user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id;
  const partnerUser = (user?.id && partnerId && Number(user.id) === Number(partnerId))
    ? user?.household?.users?.find(hu => Number(hu.id) !== Number(user.id))
    : (user?.household?.users?.find(hu => Number(hu.id) === Number(partnerId)) || user?.household?.users?.find(hu => Number(hu.id) !== Number(user.id)));
  const partnerName = partnerUser?.firstName || 'Családtag';
  const aiMeta = null as AiMeta | null; // Legacy placeholder for AI meta fallback
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<UtilityBill | null>(null);

  useEffect(() => {
    fetchAiUtilityAnomalies(selectedYear, selectedMonth);
  }, [fetchAiUtilityAnomalies, selectedMonth, selectedYear]);

  const [type, setType] = useState('');
  const [total, setTotal] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitRule, setSplitRule] = useState<UtilitySplitRule>('shared');

  const filteredBills = bills.filter(b => {
    const d = new Date(b.dueDate);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReader) return;
    if (!total) return;
    
    const targetSplitRule = utilitySplitEnabled ? splitRule : 'dani-private';
    
    if (editingBill) {
      updateBill(editingBill.id, { type, total: Number(total), dueDate, splitRule: targetSplitRule });
      setEditingBill(null);
    } else {
      addBill({ type, total: Number(total), dueDate, paidDate: null, paidBy: null, splitRule: targetSplitRule });
    }
    setIsModalOpen(false); setType(''); setTotal(''); setSplitRule('shared');
  };

  const handleEdit = (bill: UtilityBill) => {
    setEditingBill(bill);
    setType(bill.type);
    setTotal(bill.total.toString());
    setDueDate(bill.dueDate);
    setSplitRule(bill.splitRule);
    setIsModalOpen(true);
  };

  const handleGenerateMonthly = () => {
    if (isReader) return;
    const targetMonth = selectedMonth.toString().padStart(2, '0');
    const targetYearMonth = `${selectedYear}-${targetMonth}`;
    const templates: Omit<UtilityBill, 'id' | 'paidBy' | 'paidDate'>[] = [
      { type: 'Víz', total: 0, dueDate: `${targetYearMonth}-15`, splitRule: 'shared' },
      { type: 'Gáz', total: 0, dueDate: `${targetYearMonth}-15`, splitRule: 'shared' },
      { type: 'Csatorna', total: 0, dueDate: `${targetYearMonth}-15`, splitRule: 'shared' },
      { type: 'Lakásbiztosítás', total: 10000, dueDate: `${targetYearMonth}-10`, splitRule: 'shared' },
      { type: `Saját kuka (Dani)`, total: 3266, dueDate: `${targetYearMonth}-12`, splitRule: 'dani-private' },
      { type: `${partnerName} kuka`, total: 3266, dueDate: `${targetYearMonth}-12`, splitRule: 'ildi-private' },
      { type: `Saját villany (Dani)`, total: 0, dueDate: `${targetYearMonth}-10`, splitRule: 'dani-private' },
      { type: `${partnerName} villany`, total: 0, dueDate: `${targetYearMonth}-10`, splitRule: 'ildi-private' },
    ];
    templates.forEach(t => {
      const exists = bills.some(b => b.type === t.type && b.dueDate.startsWith(targetYearMonth));
      if (!exists) addBill({ ...t, paidBy: null, paidDate: null });
    });
  };

  const handleSettlement = () => {
    if (!isAdmin) return;
    if (netBalance === 0) return;
    
    const settlementAmount = Math.abs(netBalance);
    const targetDate = new Date().toISOString().split('T')[0];
    
    if (netBalance > 0) {
      // partnerName owes us, so we record that the partner paid it back
      addBill({
        type: `${partnerName} kiegyenlítés 💰`,
        total: settlementAmount,
        dueDate: targetDate,
        paidDate: targetDate,
        paidBy: isAdmin ? 'Ildi' : 'Mi',
        splitRule: isAdmin ? 'dani-private' : 'ildi-private'
      });
    } else {
      // We owe partnerName, so we record that we paid it back
      addBill({
        type: `Saját kiegyenlítés 💰`,
        total: settlementAmount,
        dueDate: targetDate,
        paidDate: targetDate,
        paidBy: isAdmin ? 'Mi' : 'Ildi',
        splitRule: isAdmin ? 'ildi-private' : 'dani-private'
      });
    }
  };

  let partnerOwesUsTotal = 0;   
  let weOwePartnerTotal = 0;   
  let wePaidGrandTotal = 0;  
  let partnerPaidGrandTotal = 0;  

  filteredBills.forEach(b => {
    // If the logged-in user paid:
    const wePaid = isAdmin ? (b.paidBy === 'Mi') : (b.paidBy === 'Ildi');
    const partnerPaid = isAdmin ? (b.paidBy === 'Ildi') : (b.paidBy === 'Mi');
    
    // Who owns/benefited from the bill private portion?
    const isOurPrivate = isAdmin ? (b.splitRule === 'dani-private') : (b.splitRule === 'ildi-private');
    const isPartnerPrivate = isAdmin ? (b.splitRule === 'ildi-private') : (b.splitRule === 'dani-private');

    if (wePaid) {
      wePaidGrandTotal += b.total;
      if (b.splitRule === 'shared') {
        partnerOwesUsTotal += b.total / 2;
      } else if (isPartnerPrivate) {
        partnerOwesUsTotal += b.total;
      }
    } else if (partnerPaid) {
      partnerPaidGrandTotal += b.total;
      if (b.splitRule === 'shared') {
        weOwePartnerTotal += b.total / 2;
      } else if (isOurPrivate) {
        weOwePartnerTotal += b.total;
      }
    }
  });

  const netBalance = partnerOwesUsTotal - weOwePartnerTotal;

  const getRuleLabel = (rule: UtilitySplitRule) => {
    if (rule === 'shared') return <><Users size={12} /> Közös (50-50%)</>;
    
    // Who pays this private bill?
    const isOurPrivate = isAdmin ? (rule === 'dani-private') : (rule === 'ildi-private');
    
    if (isOurPrivate) {
      return <><User size={12} /> Te fizeted</>;
    } else {
      return <><User size={12} /> {partnerName} fizeti</>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <Home size={24} className="text-brand-primary" /> Rezsi Menedzsment
          </h1>
          <p className="text-slate-400 text-sm">Automatikus elszámolás és kibalanszolás</p>
        </div>
        {!isReader && (
          <div className="flex flex-wrap gap-3">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-brand-primary text-brand-primary hover:bg-brand-primary/10 transition-colors" 
              onClick={handleGenerateMonthly}
            >
              <Sparkles size={16} /> Alap-tételek
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20" 
              onClick={() => { setEditingBill(null); setIsModalOpen(true); }}
            >
              <Plus size={16} /> Új Rögzítése
            </button>
          </div>
        )}
      </div>

      {utilitySplitEnabled && !partnerUser && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-3xl p-5 mb-6 text-xs font-semibold flex items-start gap-3 shadow-lg">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <b className="block text-sm text-white mb-0.5">Figyelem: A rezsimegosztás be van kapcsolva!</b>
            Nincs másik tag regisztrálva ebben a háztartásban. Hívj meg egy családtagot a <b>Beállítások</b> oldalon, hogy együtt osszátok meg a kiadásokat. Addig a felület a fallback <i>"{partnerName}"</i> nevet használja a megosztáshoz.
          </div>
        </div>
      )}

      {utilitySplitEnabled ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={`bg-slate-900/50 backdrop-blur-xl border rounded-3xl p-6 shadow-2xl relative overflow-hidden
            ${netBalance === 0 ? 'border-white/5' : netBalance > 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}
          `}>
             <h3 className={`text-xs font-black uppercase mb-3 flex items-center gap-2 tracking-widest
               ${netBalance === 0 ? 'text-green-500' : netBalance > 0 ? 'text-green-500' : 'text-red-500'}
             `}>
               <ArrowRightLeft size={16} /> {
                 netBalance === 0 
                   ? 'Pénzügyi egyensúly:' 
                   : netBalance > 0 
                     ? `${partnerName} tartozik neked:` 
                     : 'Fizetned kell (Tartozol):'
               }
             </h3>
             <div className="flex flex-wrap justify-between items-end gap-4">
                <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {netBalance === 0 ? 'Kvitt! ✨' : formatHUF(Math.abs(netBalance))}
                </div>
                {netBalance !== 0 && (
                  <button 
                    onClick={handleSettlement}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs transition-colors
                      ${netBalance > 0 ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}
                    `}
                  >
                    <UserCheck size={14} /> Kiegyenlítés
                  </button>
                )}
             </div>
             {netBalance === 0 && (
               <div className="mt-3 text-xs text-green-500 font-bold flex items-center gap-1.5">
                 <CheckCircle size={14} /> Ebben a hónapban minden elszámolva.
               </div>
             )}
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-center gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400">Összesen Te fizettél:</span>
              <span className="text-xl font-black text-brand-secondary">{formatHUF(wePaidGrandTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400">{partnerName} fizetett:</span>
              <span className="text-xl font-black text-brand-primary">{formatHUF(partnerPaidGrandTotal)}</span>
            </div>
          </div>
  
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-center gap-4">
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">{partnerName} tartozása neked:</span>
                <span className="text-xl font-black text-green-500">{formatHUF(partnerOwesUsTotal)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Te tartozásod {partnerName}-nek:</span>
                <span className="text-xl font-black text-red-500">{formatHUF(weOwePartnerTotal)}</span>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-center min-h-[120px]">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
               Havi Összes Rezsi
             </h3>
             <div className="text-3xl font-black text-white">
               {formatHUF(filteredBills.reduce((s,b) => s + b.total, 0))}
             </div>
             <p className="text-[0.6rem] text-slate-500 mt-2 font-medium">Tárgyhavi összes rezsiszámla végösszege</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-center min-h-[120px]">
             <h3 className="text-xs font-black text-green-500 uppercase tracking-widest mb-2">
               Kifizetve
             </h3>
             <div className="text-3xl font-black text-green-400">
               {formatHUF(filteredBills.filter(b => !!b.paidDate).reduce((s,b) => s + b.total, 0))}
             </div>
             <p className="text-[0.6rem] text-slate-500 mt-2 font-medium">Már kiegyenlített számlák összege</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-center min-h-[120px]">
             <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
               Fizetésre Vár
             </h3>
             <div className="text-3xl font-black text-amber-400">
               {formatHUF(filteredBills.filter(b => !b.paidDate).reduce((s,b) => s + b.total, 0))}
             </div>
             <p className="text-[0.6rem] text-slate-500 mt-2 font-medium">Függőben lévő számlák összege</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">AI anomáliafigyelés</h3>
          <button 
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-slate-300 hover:bg-white/5 transition-colors" 
            onClick={() => fetchAiUtilityAnomalies(selectedYear, selectedMonth)}
          >
            Frissítés
          </button>
        </div>
        {!!aiUtilityAnomalies?.anomalies?.length ? (
          <div className="flex flex-col gap-2 mt-2 text-sm">
            {aiUtilityAnomalies.anomalies.map((an: { meter_id: number; meter_name: string; actual: number; expected: number; reason: string }) => (
              <div key={`${an.meter_id}-${an.actual}`} className="text-slate-300">
                <b className="text-white">{an.meter_name}</b>: {an.reason} <span className="text-slate-500">(tény: {an.actual}, várható: {Math.round(an.expected)})</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-slate-500 font-medium">Nincs jelentős anomália ebben a hónapban.</div>
        )}
        {!!aiMeta?.fallback_used && (
          <div className="mt-2 text-xs text-amber-500 font-bold">Fallback detektálás aktív</div>
        )}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-slate-400 font-black">
                <th className="p-4 pl-6 font-medium">Tétel</th>
                <th className="p-4 text-right font-medium">Összeg</th>
                <th className="p-4 font-medium">Határidő</th>
                {utilitySplitEnabled && <th className="p-4 text-center font-medium">Felek</th>}
                <th className="p-4 text-center font-medium">{utilitySplitEnabled ? 'Ki Fizette?' : 'Fizetés'}</th>
                <th className="p-4 font-medium">Státusz</th>
                <th className="p-4 pr-6 text-right font-medium">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...filteredBills].sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(row => {
                 const isOverdue = !row.paidDate && row.dueDate < new Date().toISOString().split('T')[0];
                 return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6 font-black text-white">{row.type}</td>
                      <td className="p-4 text-right font-black text-white">{formatHUF(row.total)}</td>
                      <td className={`p-4 text-sm font-medium ${isOverdue ? 'text-red-500 font-black' : 'text-slate-300'}`}>
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <AlertTriangle size={12} />} {formatDate(row.dueDate)}
                        </div>
                      </td>
                      {utilitySplitEnabled && (
                        <td className="p-4 text-center">
                           <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-xs font-black text-slate-300 whitespace-nowrap">
                             {getRuleLabel(row.splitRule)}
                           </div>
                        </td>
                      )}
                      <td className="p-4 text-center">
                         {utilitySplitEnabled ? (
                           <select
                              disabled={isReader}
                              className={`bg-transparent text-xs font-black p-1.5 rounded-lg outline-none text-center appearance-none ${isReader ? 'cursor-default opacity-70' : 'cursor-pointer'}
                               ${!row.paidBy ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}
                             `} 
                             value={row.paidBy || 'Fizetendő'} 
                             onChange={(e) => {
                               const val = e.target.value === 'Fizetendő' ? null : e.target.value;
                               if (!val) updateBill(row.id, { paidBy: null, paidDate: null });
                               else updateBill(row.id, { paidBy: val as 'Mi' | 'Ildi' | null, paidDate: new Date().toISOString().split('T')[0] });
                             }}
                           >
                             <option value="Fizetendő" className="bg-slate-800 text-amber-500">Függőben</option>
                             <option value="Mi" className="bg-slate-800 text-green-500">{isAdmin ? 'Te' : partnerName}</option>
                             <option value="Ildi" className="bg-slate-800 text-green-500">{isAdmin ? partnerName : 'Te'}</option>
                           </select>
                         ) : (
                           <button
                              disabled={isReader}
                             onClick={() => {
                               if (row.paidDate) {
                                 updateBill(row.id, { paidBy: null, paidDate: null });
                               } else {
                                 updateBill(row.id, { paidBy: isAdmin ? 'Mi' : 'Ildi', paidDate: new Date().toISOString().split('T')[0] });
                               }
                             }}
                             className={`text-xs font-black px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap
                                ${row.paidDate ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}
                                ${isReader ? 'opacity-70 cursor-not-allowed' : ''}
                              `}
                           >
                             {row.paidDate ? 'Kifizetve' : 'Fizetés rögzítése'}
                           </button>
                         )}
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center gap-1.5 text-xs font-black whitespace-nowrap
                          ${row.paidDate ? 'text-green-500' : isOverdue ? 'text-red-500' : 'text-slate-500'}
                        `}>
                          {row.paidDate ? <CheckCircle size={14} /> : isOverdue ? <XCircle size={14} /> : <Clock size={14} />}
                          {row.paidDate ? `Kész` : isOverdue ? 'Lejárt' : 'Várható'}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                         {!isReader && (
            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleEdit(row)} 
                             className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                           >
                             <Edit3 size={16} />
                           </button>
                           <button 
                             onClick={() => deleteBill(row.id)} 
                             className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
          )}
                      </td>
                    </tr>
                 )
              })}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={utilitySplitEnabled ? 7 : 6} className="p-8 text-center text-slate-500 font-medium">Nincsenek rögzített tételek ebben a hónapban.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBill ? "Rezsi szerkesztése" : "Új rezsi rögzítése"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Típus</label>
            <input type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={type} onChange={e=>setType(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Végösszeg</label>
            <input type="number" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={total} onChange={e=>setTotal(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Határidő</label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
          {utilitySplitEnabled && (
            <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Elszámolás módja</label>
              <div className="flex flex-col gap-2 mt-1">
                {['shared', 'dani-private', 'ildi-private'].map(rule => {
                  const isOurPrivate = isAdmin ? (rule === 'dani-private') : (rule === 'ildi-private');
                  return (
                    <label key={rule} className="flex items-center gap-3 text-sm font-semibold text-slate-300 cursor-pointer group">
                      <input 
                        type="radio" 
                        className="w-4 h-4 accent-brand-primary bg-white/10 border-white/20"
                        checked={splitRule === rule} 
                        onChange={() => setSplitRule(rule as UtilitySplitRule)} 
                      />
                      <span className="group-hover:text-white transition-colors">
                        {rule === 'shared' 
                          ? 'Közös (50-50%)' 
                          : isOurPrivate 
                            ? `Saját magam fizetem (${myName})` 
                            : `${partnerName} fizeti`
                        }
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <button type="submit" className="mt-2 bg-brand-primary hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors">Mentés</button>
        </form>
      </Modal>

    </div>
  );
}
