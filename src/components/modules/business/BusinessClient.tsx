'use client';

import { useBusinessStore } from '@/stores/useBusinessStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF, formatDate } from '@/utils';
import { useState, useMemo } from 'react';
import { BusinessOrder } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { 
  ShoppingBag, 
  List, 
  BarChart3, 
  Plus, 
  CheckCircle, 
  Clock, 
  Edit3, 
  Trash2, 
  ArrowUpRight,
  User,
  FileText,
  TrendingUp,
  AlertCircle,
  Truck,
  Banknote,
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function BusinessClient() {
  const { orders, addOrder, deleteOrder, updateOrder, shopifyImport } = useBusinessStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const [activeTab, setActiveTab] = useState<'monthly' | 'summary'>('monthly');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form elements matching Google Sheet
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [channel, setChannel] = useState('Webshop');
  const [payment, setPayment] = useState('Kártya');
  const [provider, setProvider] = useState('Shopify payments');
  const [destination, setDestination] = useState('Szolgáltatónál parkol');
  const [paidDate, setPaidDate] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState('');

  // FILTERING logic
  const selectedYearMonthPrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const filteredOrders = useMemo(() => {
    return orders.filter(o => o.date.startsWith(selectedYearMonthPrefix))
                 .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, selectedYearMonthPrefix]);

  const openForm = (order?: BusinessOrder) => {
    if (order) {
      setEditId(order.id);
      setCustomer(order.customerName || '');
      setAmount(String(order.amount || ''));
      setOrderDate(order.date || new Date().toISOString().split('T')[0]);
      setChannel(order.channel || 'Webshop');
      setPayment(order.paymentMethod || 'Kártya');
      setProvider(order.provider || 'Nincs');
      setDestination(order.destination || 'Szolgáltatónál parkol');
      setPaidDate(order.paidDate || '');
      setInvoiceId(order.invoiceId || '');
    } else {
      setEditId(null);
      setCustomer('');
      setAmount('');
      setOrderDate(new Date().toISOString().split('T')[0]);
      setChannel('Webshop');
      setPayment('Kártya');
      setProvider('Shopify payments');
      setDestination('Szolgáltatónál parkol');
      setPaidDate('');
      setInvoiceId('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !customer) return;

    const payload = {
      date: orderDate,
      customerName: customer,
      channel,
      paymentMethod: payment,
      provider,
      destination,
      amount: Number(amount),
      paidDate: paidDate || null,
      invoiceId,
      state: (paidDate ? 'RENDBEN' : 'KINT') as 'RENDBEN' | 'KINT'
    };

    if (editId) updateOrder(editId, payload);
    else addOrder(payload);
    
    setIsModalOpen(false);
  };

  const handleShopifySync = async () => {
    setIsSyncing(true);
    try {
      await shopifyImport();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Yearly & Business Insights Data
  const businessStats = useMemo(() => {
    const totalYTD = orders.filter(o => o.date.startsWith(String(selectedYear))).reduce((s,o) => s + o.amount, 0);
    const orderCount = orders.length;
    const aov = orderCount > 0 ? totalYTD / orders.filter(o => o.date.startsWith(String(selectedYear))).length : 0;
    
    const channelMap = orders.reduce((acc, o) => {
      acc[o.channel] = (acc[o.channel] || 0) + o.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topChannel = Object.entries(channelMap).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Nincs adat';
    
    const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const chartData = months.map((m, i) => {
      const mStr = (i + 1).toString().padStart(2, '0');
      const prefix = `${selectedYear}-${mStr}`;
      const mOrders = orders.filter(o => o.date.startsWith(prefix));
      const received = mOrders.filter(o => !!o.paidDate).reduce((s,o) => s + o.amount, 0);
      const pending = mOrders.filter(o => !o.paidDate).reduce((s,o) => s + o.amount, 0);
      return {
        name: m,
        bevetel: received,
        kintlevoseg: pending
      };
    });

    // Simple AI advice logic based on data
    let aiAdvice = "A vállalkozásod adatai stabilak. ";
    if (topChannel === 'Meska') aiAdvice += "A Meska kiemelkedően teljesít, érdemes lehet ott egyedi kampányokat indítani. ";
    if (totalYTD > 1000000) aiAdvice += "Gratulálunk, átlépted az 1 milliós éves forgalmat! ";
    if (aov < 5000) aiAdvice += "Az átlagos kosárérték növeléséhez próbálj meg kiegészítő termékeket ajánlani a pénztárnál. ";

    return { totalYTD, aov, topChannel, channelData, chartData, aiAdvice };
  }, [orders, selectedYear]);

  const { totalYTD, aov, topChannel, channelData, chartData, aiAdvice } = businessStats;

  const totalMonthlyIncome = filteredOrders.reduce((s,o) => s + o.amount, 0);
  const totalMonthlyPaid = filteredOrders.filter(o => o.state === 'RENDBEN').reduce((s,o) => s + o.amount, 0);
  const totalMonthlyPending = filteredOrders.filter(o => o.state !== 'RENDBEN').reduce((s,o) => s + o.amount, 0);

  const getChannelIcon = (c: string) => {
    if (c === 'Webshop') return <ShoppingBag size={14} className="text-brand-primary" />;
    if (c === 'Hello Piac') return <Truck size={14} className="text-amber-500" />;
    if (c === 'Meska') return <ShoppingBag size={14} className="text-pink-500" />;
    return <User size={14} className="text-slate-500" />;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <ShoppingBag size={24} className="text-brand-primary" /> Little Loom CRM
          </h1>
          <p className="text-slate-400 text-sm">{selectedYear}. {selectedMonth}. havi adatok</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border
              ${activeTab === 'monthly' ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white'}
            `}
            onClick={() => setActiveTab('monthly')}
          >
            <List size={16} /> Rendelések
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border
              ${activeTab === 'summary' ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white'}
            `}
            onClick={() => setActiveTab('summary')}
          >
            <BarChart3 size={16} /> Éves Trendek
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden bg-blue-500/5 border-blue-500/20">
            <div className="text-[0.65rem] font-black text-brand-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
               <TrendingUp size={14} /> Havi Forgalom
            </div>
            <div className="text-3xl font-black text-white tracking-tight">{formatHUF(totalMonthlyIncome)}</div>
         </div>
         <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden bg-green-500/5 border-green-500/20">
            <div className="text-[0.65rem] font-black text-green-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
               <CheckCircle size={14} /> Beérkezett
            </div>
            <div className="text-3xl font-black text-green-500 tracking-tight">{formatHUF(totalMonthlyPaid)}</div>
         </div>
         <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden bg-red-500/5 border-red-500/20">
            <div className="text-[0.65rem] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
               <AlertCircle size={14} /> Kintlévőség
            </div>
            <div className="text-3xl font-black text-red-500 tracking-tight">{formatHUF(totalMonthlyPending)}</div>
         </div>
      </div>

      {activeTab === 'monthly' && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-white/5 flex flex-wrap justify-between items-center gap-4">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">HIVATALOS NAPLÓ</h3>
             <div className="flex flex-wrap gap-3">
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-green-500 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors" 
                  onClick={handleShopifySync}
                  disabled={isSyncing}
                >
                   <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                   {isSyncing ? 'Shopify szinkron...' : 'Shopify Import'}
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20" 
                  onClick={() => openForm()}
                >
                   <Plus size={16} /> Új Rendelés
                </button>
             </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-slate-400 font-black">
                  <th className="p-4 pl-6 font-medium">Dátum</th>
                  <th className="p-4 font-medium">Vevő</th>
                  <th className="p-4 font-medium">Rendelés</th>
                  <th className="p-4 font-medium">Forrás</th>
                  <th className="p-4 font-medium">Fizetés módja</th>
                  <th className="p-4 text-right font-medium">Összeg</th>
                  <th className="p-4 font-medium">Számla ID</th>
                  <th className="p-4 text-center font-medium">Státusz</th>
                  <th className="p-4 pr-6 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.length > 0 ? filteredOrders.map(order => {
                  const isPaid = !!order.paidDate;
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6 text-xs text-slate-400 font-medium">{formatDate(order.date)}</td>
                      <td className="p-4 font-black text-white">{order.customerName}</td>
                      <td className="p-4">
                         <div className="flex items-center gap-1.5">
                            <span className="text-[0.65rem] font-black bg-white/5 px-2 py-0.5 rounded text-slate-300">
                               {order.shopifyOrderNumber || '—'}
                            </span>
                         </div>
                      </td>
                      <td className="p-4">
                         <div className="flex items-center gap-1.5">
                            {getChannelIcon(order.channel)}
                            <span className="text-xs font-bold text-slate-300">{order.channel}</span>
                         </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400 font-medium">{order.paymentMethod} • {order.provider}</td>
                      <td className="p-4 text-right font-black text-white">{formatHUF(order.amount)}</td>
                      <td className="p-4 text-xs">
                         <div className="flex items-center gap-1.5 text-slate-400">
                            <FileText size={12} /> {order.invoiceId || '—'}
                         </div>
                      </td>
                      <td className="p-4 text-center">
                         <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.65rem] font-black border whitespace-nowrap
                           ${order.state === 'RENDBEN' 
                             ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                             : order.state === 'KINT_PARKOL' 
                               ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                               : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}
                         `}>
                           {order.state === 'RENDBEN' ? <CheckCircle size={12} /> : <Clock size={12} />}
                           {order.state === 'RENDBEN' ? `RENDBEN (${formatDate(order.paidDate!)})` : order.state === 'KINT_PARKOL' ? 'PARKOL' : 'KINT'}
                         </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                          <button 
                            onClick={() => openForm(order)} 
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteOrder(order.id)} 
                            className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={9} className="p-12 text-center text-slate-500 font-medium">Még nincsenek adatok ebben a hónapban.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="flex flex-col gap-6">
          {/* AI ADVISOR PANEL */}
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
             <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                   <Cpu size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Little Loom AI Stratéga</h4>
                   <p className="text-slate-200 text-base font-medium italic">"{aiAdvice}"</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Éves Forgalom (YTD)</div>
                <div className="text-2xl font-black text-white">{formatHUF(totalYTD)}</div>
             </div>
             <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Átlagos Rendelés (AOV)</div>
                <div className="text-2xl font-black text-brand-primary">{formatHUF(aov)}</div>
             </div>
             <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Húzó Csatorna</div>
                <div className="text-2xl font-black text-amber-500">{topChannel}</div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-brand-primary" /> Havi Cashflow ({selectedYear})
               </h3>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                       <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                       <Tooltip 
                         cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                         content={({ active, payload, label }) => {
                           if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                                 <div className="text-xs font-black text-slate-500 uppercase mb-2">{label} havi mérleg</div>
                                 {(payload as unknown as Array<{ name: string; value: number }>).map((p) => (
                                   <div key={p.name} className="flex items-center justify-between gap-6 mb-1">
                                     <span className="text-[0.65rem] font-bold text-slate-300">{p.name === 'bevetel' ? 'Bevétel' : 'Kintlévőség'}</span>
                                     <span className={`text-xs font-black ${p.name === 'bevetel' ? 'text-brand-primary' : 'text-red-500'}`}>{formatHUF(p.value)}</span>
                                   </div>
                                 ))}
                               </div>
                             );
                           }
                           return null;
                         }}
                       />
                       <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 20, fontSize: '11px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }} />
                       <Bar dataKey="bevetel" fill="#7c6af7" name="Bevétel" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="kintlevoseg" fill="#ef4444" name="Kintlévőség" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  Csatorna Megoszlás
               </h3>
               <div className="flex flex-col gap-4">
                  {channelData.map((c, i) => {
                    const percentage = totalYTD > 0 ? Math.round((c.value / totalYTD) * 100) : 0;
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                           <span className="font-bold text-slate-300">{c.name}</span>
                           <span className="font-black text-white">{percentage}% ({formatHUF(c.value)})</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-brand-primary rounded-full transition-all duration-1000" 
                             style={{ width: `${percentage}%`, backgroundColor: i === 0 ? '#7c6af7' : i === 1 ? '#ec4899' : '#f59e0b' }} 
                           />
                        </div>
                      </div>
                    );
                  })}
               </div>
               <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[0.65rem] font-bold text-slate-400 uppercase mb-2 tracking-widest text-center">Megjegyzés</div>
                  <p className="text-[0.7rem] text-slate-500 leading-relaxed text-center">A statisztikák a {selectedYear}-es év összes eddigi rendelését veszik alapul, csatornánkénti súlyozással.</p>
               </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Rendelés rögzítése">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dátum</label>
               <DatePicker value={orderDate} onChange={setOrderDate} />
             </div>
             <div className="flex flex-col gap-1.5">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vevő Neve</label>
               <div className="relative">
                 <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                 <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={customer} onChange={e=>setCustomer(e.target.value)} required placeholder="pl. Tóth Tímea" />
               </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Összeg (Ft)</label>
              <div className="relative">
                <Banknote size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={amount} onChange={e=>setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Csatorna</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white appearance-none" value={channel} onChange={e=>setChannel(e.target.value)}>
                <option className="bg-slate-800">Webshop</option>
                <option className="bg-slate-800">Meska</option>
                <option className="bg-slate-800">Privát rendelés</option>
                <option className="bg-slate-800">Hello Piac</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fizetés Módja</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white appearance-none" value={payment} onChange={e=>setPayment(e.target.value)}>
                <option className="bg-slate-800">Kártya</option><option className="bg-slate-800">Utalás</option><option className="bg-slate-800">Utánvét</option><option className="bg-slate-800">Készpénz</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Szolgáltató</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white appearance-none" value={provider} onChange={e=>setProvider(e.target.value)}>
                <option className="bg-slate-800">Shopify payments</option><option className="bg-slate-800">Barion</option><option className="bg-slate-800">SumUp</option><option className="bg-slate-800">DPD</option><option className="bg-slate-800">GLS</option><option className="bg-slate-800">Foxpost</option><option className="bg-slate-800">Nincs</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hova érkezik</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white appearance-none" value={destination} onChange={e=>setDestination(e.target.value)}>
               <option className="bg-slate-800">Szolgáltatónál parkol</option><option className="bg-slate-800">Privát számla</option><option className="bg-slate-800">Készpénz</option>
            </select>
          </div>

          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col gap-4 mt-2">
             <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">Kifizetési és számla adatok</div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kifizetés Dátuma</label>
                 <DatePicker value={paidDate} onChange={setPaidDate} />
               </div>
               <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Számla Sorszáma</label>
                 <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={invoiceId} onChange={e=>setInvoiceId(e.target.value)} placeholder="E-LL-2026-XX" />
               </div>
             </div>
          </div>

          <button type="submit" className="mt-4 bg-brand-primary hover:bg-brand-light text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-brand-primary/20">Adatok Rögzítése</button>
        </form>
      </Modal>

    </div>
  );
}
