'use client';

import { useEffect, useState } from 'react';
import { useMetersStore } from '@/stores/useMetersStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { Meter, MeterReading } from '@/types';
import { formatNumber, formatDate } from '@/utils';
import { aiFinanceClient } from '@/api';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DatePicker } from '@/components/ui/DatePicker';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { 
  Zap, 
  Droplets, 
  Flame, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  History,
  ChevronDown,
  ChevronUp,
  Bot,
  PlusCircle,
  Sparkles
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

function getChartData(
  meter: Meter, 
  selectedYear: number, 
  getPreviousYearValue: (meterId: number, month: number, currentYear: number) => number | null
) {
  const result = [];
  for(let m = 1; m <= 12; m++) {
    const cyData = meter.readings.find((r: MeterReading) => r.month === m && r.year === selectedYear);
    const pyData = getPreviousYearValue(meter.id, m, selectedYear);
    result.push({
      monthName: MONTH_NAMES[m-1],
      idei: cyData ? cyData.consumption : null,
      tavalyi: pyData !== null ? pyData : null
    });
  }
  return result;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    stroke?: string;
    color?: string;
    fill?: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
        <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="flex flex-col gap-2">
          {payload.map((entry: { name: string; value: number; color?: string }, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }}></div>
              <div className="flex-1 text-xs font-bold text-white">{entry.name}:</div>
              <div className="text-sm font-black" style={{ color: entry.color }}>{formatNumber(entry.value)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const getMeterIcon = (name: string, size = 24) => {
  if (name.includes('Villany')) return <Zap size={size} className="text-amber-500" />;
  if (name.includes('Víz')) return <Droplets size={size} className="text-blue-500" />;
  if (name.includes('Gáz')) return <Flame size={size} className="text-red-500" />;
  return <Zap size={size} className="text-brand-primary" />;
};

function MeterCard({ 
  meter, 
  selectedYear, 
  getPreviousYearValue, 
  deleteMeterReading, 
  onAiClick, 
  onEditReading, 
  onAddReading, 
  onDeleteMeter, 
  onDeleteReading 
}: { 
  meter: Meter;
  selectedYear: number;
  getPreviousYearValue: (meterId: number, month: number, currentYear: number) => number | null;
  deleteMeterReading: (meterId: number, readingId: number) => Promise<void>;
  onAiClick: (id: number) => void;
  onEditReading: (m: Meter, r: MeterReading) => void;
  onAddReading: (m: Meter) => void;
  onDeleteMeter: (id: number) => void;
  onDeleteReading: (mId: number, rId: number) => void;
}) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [calcValue, setCalcValue] = useState<string>('');
  const { addMeterReading } = useMetersStore();

  const chartData = getChartData(meter, selectedYear, getPreviousYearValue);
  
  const yearReadings = meter.readings.filter((r: MeterReading) => r.year === selectedYear).sort((a: MeterReading, b: MeterReading) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const otherReadings = meter.readings.filter((r: MeterReading) => r.year !== selectedYear).sort((a: MeterReading, b: MeterReading) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const displayReadings = showFullHistory ? [...yearReadings, ...otherReadings] : yearReadings;

  const sortedAllReadings = [...meter.readings].sort((a: MeterReading, b: MeterReading) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestReading = sortedAllReadings[0];
  const currentVal = parseFloat(calcValue);
  const diff = latestReading && !isNaN(currentVal) ? currentVal - latestReading.value : 0;

  const sortedOfficialReadings = [...meter.readings]
    .filter((r: MeterReading) => r.isOfficial || r.is_official)
    .sort((a: MeterReading, b: MeterReading) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestOfficialReading = sortedOfficialReadings[0];
  const consumptionSinceOfficial = latestReading && latestOfficialReading ? latestReading.value - latestOfficialReading.value : null;

  const handleSaveCalc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcValue || isNaN(currentVal) || diff < 0) return;
    const todayStr = new Date().toISOString().split('T')[0];
    addMeterReading(meter.id, {
      date: todayStr,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      value: currentVal,
      isReset: false,
      isEstimated: false
    });
    setCalcValue('');
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
      <div className="p-5 md:p-6 bg-white/5 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
             {getMeterIcon(meter.name, 28)}
           </div>
           <div>
             <h2 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">{meter.name}</h2>
             <div className="flex items-center gap-2 mt-1">
               <span className="text-[0.65rem] md:text-xs font-black text-slate-500 uppercase tracking-wider">Fogyasztás • {meter.unit}</span>
               <div className="w-1 h-1 rounded-full bg-slate-600"></div>
               <span className="text-[0.65rem] md:text-xs font-black text-brand-primary uppercase tracking-wider">{meter.location}</span>
             </div>
           </div>
         </div>
          <div className="flex flex-wrap gap-2 items-center">
             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary text-white hover:bg-brand-light transition-colors shadow-lg" onClick={() => onAddReading(meter)}>
               <PlusCircle size={14} /> Leolvasás
             </button>
             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-brand-primary text-brand-primary hover:bg-brand-primary/10 transition-colors" onClick={() => onAiClick(meter.id)}>
               <Sparkles size={14} /> Becslés (AI)
             </button>
             <button className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-1" onClick={() => onDeleteMeter(meter.id)}>
               <Trash2 size={16} />
             </button>
          </div>
      </div>
      
      <div className="p-5 md:p-6 min-h-[340px]">
         <div className="flex justify-between items-center py-4">
            <div className="flex gap-6 flex-wrap">
               <div>
                  <div className="text-[0.65rem] text-slate-500 font-black uppercase tracking-widest mb-1">Idei Összes</div>
                  <div className="text-xl font-black text-white">{formatNumber(yearReadings.reduce((s, r)=>s+r.consumption, 0))} {meter.unit}</div>
               </div>
               <div className="w-px bg-white/10"></div>
               <div>
                  <div className="text-[0.65rem] text-slate-500 font-black uppercase tracking-widest mb-1">Tavalyi Összes</div>
                  <div className="text-xl font-black text-slate-400">{formatNumber(meter.readings.filter(r=>r.year === selectedYear -1).reduce((s, r)=>s+r.consumption, 0))} {meter.unit}</div>
               </div>
               <div className="w-px bg-white/10"></div>
               <div>
                  <div className="text-[0.65rem] text-brand-primary font-black uppercase tracking-widest mb-1">Hivatalos leolvasás óta</div>
                  {consumptionSinceOfficial !== null && latestOfficialReading ? (
                     <div className="text-xl font-black text-emerald-400">
                        {formatNumber(consumptionSinceOfficial)} {meter.unit}
                        <span className="text-[0.65rem] text-slate-500 font-bold block normal-case mt-0.5">({formatDate(latestOfficialReading.date)} óta)</span>
                     </div>
                  ) : (
                     <div className="text-sm font-bold text-slate-500 mt-1">Nincs hivatalos állás</div>
                  )}
               </div>
            </div>
         </div>

         {latestReading && (
            <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
               <div className="flex flex-col gap-1">
                  <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                     Részleges Fogyasztás Kalkulátor
                  </div>
                  <div className="text-xs text-slate-300">
                     Utolsó mentett állás: <b className="text-white">{formatNumber(latestReading.value)} {meter.unit}</b> ({formatDate(latestReading.date)})
                  </div>
               </div>
               <form onSubmit={handleSaveCalc} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="relative">
                     <input
                        type="number"
                        placeholder="Aktuális állás..."
                        value={calcValue}
                        onChange={(e) => setCalcValue(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary w-40"
                     />
                     {calcValue && (
                        <div className={`absolute left-0 -bottom-5 text-[0.65rem] font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                           {diff >= 0 ? `+${formatNumber(diff)} ${meter.unit}` : `${formatNumber(diff)} ${meter.unit} (Kisebb!)`}
                        </div>
                     )}
                  </div>
                  <button
                     type="submit"
                     disabled={!calcValue || isNaN(currentVal) || diff < 0}
                     className="px-3 py-2 bg-brand-primary hover:bg-brand-light disabled:bg-slate-800 disabled:text-slate-500 text-xs font-bold text-white rounded-xl transition-all shadow-md"
                  >
                     Rögzítés új leolvasásként
                  </button>
               </form>
            </div>
         )}

         <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height={240}>
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                  <linearGradient id={`colorIdei-${meter.id}`} x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.4}/>
                     <stop offset="100%" stopColor="#7c6af7" stopOpacity={0}/>
                  </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="tavalyi" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="Tavaly" />
                  <Area type="monotone" dataKey="idei" stroke="#7c6af7" strokeWidth={3} fillOpacity={1} fill={`url(#colorIdei-${meter.id})`} name="Idén" activeDot={{ r: 6, fill: '#7c6af7', stroke: 'white', strokeWidth: 2 }} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="overflow-x-auto border-t border-white/5 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/5 text-[0.65rem] uppercase tracking-wider text-slate-400 font-black">
              <th className="p-4 pl-6">Dátum</th>
              <th className="p-4 text-right">Állás</th>
              <th className="p-4">Megjegyzés</th>
              <th className="p-4 text-right">Fogyasztás</th>
              <th className="p-4 pr-6 text-right">Műveletek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayReadings.map((r: MeterReading) => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4 pl-6 text-xs font-bold text-white">{formatDate(r.date)}</td>
                <td className="p-4 text-right font-black text-slate-200">{formatNumber(r.value)} <span className="text-[0.65rem] text-slate-500 font-bold">{meter.unit}</span></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {(r.isOfficial || r.is_official) && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[0.6rem] font-black">🏢 HIVATALOS</span>}
                    {(r.isReset || r.is_reset) && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[0.6rem] font-black"><RefreshCw size={10} /> CSAPERE</span>}
                    {(r.isEstimated || r.is_estimated) && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-brand-primary text-[0.6rem] font-black"><Bot size={10} /> AI</span>}
                  </div>
                </td>
                <td className="p-4 text-right font-black text-brand-primary">
                  {formatNumber(r.consumption)} <span className="text-[0.65rem] text-brand-primary/50 font-bold">{meter.unit}</span>
                </td>
                <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                      <button onClick={() => onEditReading(meter, r)} className="p-1 text-slate-500 hover:text-white transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => onDeleteReading(meter.id, r.id)} className="p-1 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                </td>
              </tr>
            ))}
            {displayReadings.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500 text-sm font-medium">Nincs leolvasás ebben az időszakban.</td></tr>
            )}
          </tbody>
        </table>
        
        {otherReadings.length > 0 && (
          <div className="p-4 text-center bg-white/[0.01]">
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors" 
              onClick={() => setShowFullHistory(!showFullHistory)}
            >
              {showFullHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showFullHistory ? 'Korábbiak elrejtése' : `További ${otherReadings.length} leolvasás...`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetersClient() {
  const { meters, addMeter, deleteMeter, addMeterReading, updateMeterReading, deleteMeterReading } = useMetersStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<{ meter: Meter, reading: MeterReading } | null>(null);
  
  const [meterId, setMeterId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [value, setValue] = useState('');
  const [isReset, setIsReset] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTargetMeter, setAiTargetMeter] = useState(1);
  const [aiYear, setAiYear] = useState(selectedYear);
  const [aiMonth, setAiMonth] = useState(selectedMonth);

  const [isNewMeterModalOpen, setIsNewMeterModalOpen] = useState(false);
  const [newMeterName, setNewMeterName] = useState('');
  const [newMeterUnit, setNewMeterUnit] = useState('kWh');
  const [newMeterLoc, setNewMeterLoc] = useState('Otthon');

  const [confirmMeterDelete, setConfirmMeterDelete] = useState<number | null>(null);
  const [confirmReadingDelete, setConfirmReadingDelete] = useState<{ mId: number, rId: number } | null>(null);

  useEffect(() => {
    fetchAiUtilityAnomalies(selectedYear, selectedMonth);
  }, [fetchAiUtilityAnomalies, selectedMonth, selectedYear]);

  const handleMeterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMeter({ name: newMeterName, unit: newMeterUnit, location: newMeterLoc });
    setIsNewMeterModalOpen(false);
    setNewMeterName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    if (editingReading) updateMeterReading(editingReading.meter.id, editingReading.reading.id, { date, value: Number(value), isReset, isOfficial });
    else addMeterReading(meterId, { date, month: new Date(date).getMonth() + 1, year: new Date(date).getFullYear(), value: Number(value), isReset, isOfficial, isEstimated: false });
    setIsModalOpen(false); setValue(''); setIsReset(false); setIsOfficial(false);
  };

  const openEdit = (m: Meter, r: MeterReading) => {
    setEditingReading({ meter: m, reading: r }); setMeterId(m.id); setDate(r.date); setValue(r.value.toString()); setIsReset(r.isReset); setIsOfficial(r.isOfficial || false); setIsModalOpen(true);
  };

  const getPreviousYearValue = (mId: number, month: number, year: number): number | null => {
    const meter = meters.find(m => m.id === mId);
    if (!meter) return null;
    const py = meter.readings.find(r => r.month === month && r.year === year - 1);
    return py ? py.consumption : null;
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const meter = meters.find(m => m.id === aiTargetMeter);
    if (!meter) return;
    
    setIsAiLoading(true);
    try {
        const targetDate = new Date(`${aiYear}-${aiMonth.toString().padStart(2, '0')}-15`);
        const sortedReadings = [...meter.readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const existingForTarget = sortedReadings.find(r => r.year === aiYear && r.month === aiMonth);
        if (existingForTarget) {
          alert('Erre a hónapra már van leolvasás. AI becslés csak hiányzó hónapra készíthető.');
          return;
        }

        let previousReading: MeterReading | null = null;
        let nextReading: MeterReading | null = null;
        for (const reading of sortedReadings) {
          const readingDate = new Date(reading.date);
          if (readingDate < targetDate) previousReading = reading;
          if (readingDate > targetDate) {
            nextReading = reading;
            break;
          }
        }

        if (!previousReading) {
          alert('Nincs korábbi leolvasás, amihez az AI becslést rögzíteni lehetne.');
          return;
        }

        const prevYearSameMonth = getPreviousYearValue(aiTargetMeter, aiMonth, aiYear);
        const historicalReadings = sortedReadings
          .filter(r => new Date(r.date) < targetDate)
          .map(r => ({
            year: r.year,
            month: r.month,
            consumption: Math.max(0, r.consumption),
            value: r.value
          }));

        const monthSeries = historicalReadings
          .map(r => `${r.year}-${String(r.month).padStart(2, '0')}: ${r.consumption}`)
          .join(', ');

        const sameMonthHistory = historicalReadings
          .filter(r => r.month === aiMonth)
          .map(r => r.consumption);

        const lastSixConsumptions = historicalReadings.slice(-6).map(r => r.consumption);

        const prompt = `Becsüld meg egy közműóra (${meter.name}) fogyasztását a célhónapra. 
Ez NEM egyszerű átlag feladat: szezonális mintát (tél/nyár), trendet és anomáliákat is értelmezned kell.

Célidőszak: ${aiYear}-${String(aiMonth).padStart(2, '0')}
Mértékegység: ${meter.unit}
Múlt év azonos hónapja: ${prevYearSameMonth !== null ? prevYearSameMonth : 'Nincs adat'}
Azonos hónap korábbi évei: ${sameMonthHistory.length ? sameMonthHistory.join(', ') : 'Nincs adat'}
Legutóbbi 6 ismert havi fogyasztás: ${lastSixConsumptions.length ? lastSixConsumptions.join(', ') : 'Nincs adat'}
Teljes historikus idősor (YYYY-MM: fogyasztás): ${monthSeries || 'Nincs adat'}

Feladat:
1) Elemezd a szezonalitást és trendet.
2) Adj reális becslést a célhónapra.
3) Válaszod CSAK egyetlen egész szám legyen (szöveg és mértékegység nélkül).`;

        const res = await aiFinanceClient.query(prompt, false);
        const aiAnswer = res.data.answer.replace(/[^0-9]/g, '');
        let estimatedConsumption = parseInt(aiAnswer, 10);
        
        if (isNaN(estimatedConsumption)) {
            if (sameMonthHistory.length > 0) {
              estimatedConsumption = Math.round(sameMonthHistory.reduce((s, c) => s + c, 0) / sameMonthHistory.length);
            } else if (lastSixConsumptions.length > 0) {
              const weights = lastSixConsumptions.map((_, i) => i + 1);
              const weightedSum = lastSixConsumptions.reduce((s, c, i) => s + c * weights[i], 0);
              const totalWeight = weights.reduce((s, w) => s + w, 0);
              estimatedConsumption = Math.round(weightedSum / totalWeight);
            } else if (prevYearSameMonth !== null) {
              estimatedConsumption = Math.round(prevYearSameMonth);
            } else {
              estimatedConsumption = 1;
            }
        }
        estimatedConsumption = Math.max(1, estimatedConsumption);

        if (nextReading && !nextReading.isReset) {
          const maxAllowed = Math.max(0, nextReading.value - previousReading.value);
          estimatedConsumption = Math.min(estimatedConsumption, maxAllowed);
        }

        await addMeterReading(aiTargetMeter, { date: `${aiYear}-${aiMonth.toString().padStart(2, '0')}-15`, month: aiMonth, year: aiYear, value: previousReading.value + estimatedConsumption, isReset: false, isEstimated: true });
        setIsAiModalOpen(false);
    } catch (err) {
        console.error(err);
        alert('Hiba az AI becslés során. Kérlek ellenőrizd az OPENAI_API_KEY beállítását a szerveren.');
    } finally {
        setIsAiLoading(false);
    }
  };

  const locationGroups = meters.reduce((acc, m) => {
    if (!acc[m.location]) acc[m.location] = [];
    acc[m.location].push(m);
    return acc;
  }, {} as Record<string, Meter[]>);

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <History size={24} className="text-brand-primary" /> Közműórák Figyelése
          </h1>
          <p className="text-slate-400 text-sm">Mérőóra állások, trendek és AI-alapú becslések</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-light text-white transition-colors shadow-lg shadow-brand-primary/20" 
            onClick={() => setIsNewMeterModalOpen(true)}
          >
            <PlusCircle size={16} /> Új Mérőóra
          </button>
        </div>
      </div>

      {!!aiUtilityAnomalies?.anomalies?.length && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col gap-3">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="text-[0.65rem] font-black uppercase text-amber-500 tracking-widest">AI anomáliák ezen a hónapon</div>
            <button 
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-slate-300 hover:bg-white/5 transition-colors" 
              onClick={() => fetchAiUtilityAnomalies(selectedYear, selectedMonth)}
            >
              Frissítés
            </button>
          </div>
          <div className="flex flex-col gap-1 text-sm text-slate-300">
             {aiUtilityAnomalies.anomalies.map((a: { meter_id: number; meter_name: string; actual: number; expected: number; reason: string }) => (
               <div key={`${a.meter_id}-${a.actual}`}><b className="text-white">{a.meter_name}</b>: {a.reason}</div>
             ))}
          </div>
        </div>
      )}

      {Object.keys(locationGroups).map(loc => (
        <div key={loc} className="flex flex-col gap-5">
           <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
             <MapPin size={16} className="text-brand-primary" /> {loc}
           </h2>
           <div className="flex flex-col gap-6">
             {locationGroups[loc].map((meter) => (
                <MeterCard 
                   key={meter.id} 
                   meter={meter} 
                   selectedYear={selectedYear} 
                   getPreviousYearValue={getPreviousYearValue} 
                   deleteMeterReading={deleteMeterReading} 
                   onAiClick={(id) => { setAiTargetMeter(id); setIsAiModalOpen(true); }} 
                   onEditReading={openEdit} 
                   onAddReading={(m) => { setEditingReading(null); setMeterId(m.id); setValue(''); setDate(new Date().toISOString().split('T')[0]); setIsReset(false); setIsOfficial(false); setIsModalOpen(true); }}
                   onDeleteMeter={(id) => setConfirmMeterDelete(id)}
                   onDeleteReading={(mId, rId) => setConfirmReadingDelete({ mId, rId })}
                />
             ))}
           </div>
        </div>
      ))}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mérőóra rögzítése">
         <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Melyik mérőóra?</label>
               <select 
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white appearance-none" 
                 value={meterId} 
                 onChange={e=>setMeterId(Number(e.target.value))} 
                 disabled={!!editingReading}
               >
                  <option value={0} disabled className="bg-slate-800">Válassz mérőórát...</option>
                  {meters.map(m => (
                     <option key={m.id} value={m.id} className="bg-slate-800">{m.name} ({m.location})</option>
                  ))}
               </select>
            </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dátum</label>
            <DatePicker value={date} onChange={setDate} />
          </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mérőóra állás</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={value} onChange={e=>setValue(e.target.value)} required />
            </div>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-300 cursor-pointer p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-brand-primary border-white/20" checked={isReset} onChange={e=>setIsReset(e.target.checked)} /> 
              Óracsere történt
            </label>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-300 cursor-pointer p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-brand-primary border-white/20" checked={isOfficial} onChange={e=>setIsOfficial(e.target.checked)} /> 
              🏢 Szolgáltató általi hivatalos leolvasás
            </label>
            <button type="submit" className="mt-2 bg-brand-primary hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-brand-primary/20">Mentés</button>
         </form>
      </Modal>

      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI BECSLÉS">
         <form onSubmit={handleAiSubmit} className="flex flex-col gap-5">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-sm font-medium text-slate-200">
              Célirányosan pótolhatod a kimaradt hónapokat a trendek alapján.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Év</label>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={aiYear} onChange={e=>setAiYear(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hónap</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white appearance-none" value={aiMonth} onChange={e=>setAiMonth(Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=><option key={m} value={m} className="bg-slate-800">{m}. Hónap</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="mt-2 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-brand-primary/20" disabled={isAiLoading}>
              {isAiLoading && <RefreshCw size={16} className="animate-spin" />}
              {isAiLoading ? 'Becslés folyamatban...' : 'Generálás'}
            </button>
         </form>
      </Modal>

      <Modal isOpen={isNewMeterModalOpen} onClose={() => setIsNewMeterModalOpen(false)} title="Új mérőóra hozzáadása">
         <form onSubmit={handleMeterSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mérőóra megnevezése</label>
               <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" placeholder="pl. Villanyóra, Vízóra (Nappali)" value={newMeterName} onChange={e=>setNewMeterName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mértékegység</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={newMeterUnit} onChange={e=>setNewMeterUnit(e.target.value)} />
               </div>
               <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Helyszín</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white" value={newMeterLoc} onChange={e=>setNewMeterLoc(e.target.value)} />
               </div>
            </div>
            <button type="submit" className="mt-2 bg-brand-primary hover:bg-brand-light text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-brand-primary/20">Mérőóra létrehozása</button>
         </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!confirmMeterDelete} 
        onClose={() => setConfirmMeterDelete(null)} 
        onConfirm={() => confirmMeterDelete && deleteMeter(confirmMeterDelete)}
        title="Mérőóra törlése"
        message="Biztosan törlöd ezt a mérőórát az összes állással együtt? Ez a művelet nem vonható vissza."
      />

      <ConfirmModal 
        isOpen={!!confirmReadingDelete} 
        onClose={() => setConfirmReadingDelete(null)} 
        onConfirm={() => confirmReadingDelete && deleteMeterReading(confirmReadingDelete.mId, confirmReadingDelete.rId)}
        title="Leolvasás törlése"
        message="Biztosan törlöd ezt az óraállást? A fogyasztási adatok újraszámolásra kerülnek."
      />
    </div>
  );
}
