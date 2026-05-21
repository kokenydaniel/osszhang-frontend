'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMetersStore } from '@/stores/useMetersStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveMetersSettings } from '@/lib/metersSettings';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { Meter, MeterReading } from '@/types';
import { formatNumber, formatDate } from '@/utils';
import { aiFinanceClient } from '@/lib/api-client';
import { Modal } from '@/components/ui/Modal';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleOptionCard } from '@/components/ui/toggle-option-card';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import {
  bracketAnchorReadings,
  canInterpolateBetween,
  interpolateMeterValue,
  isAnchorReading,
  listAllGapMonthsBetweenAnchors,
  parseAiConsumption,
  seasonalConsumptionEstimate,
  sortReadingsByDate,
  targetDateForMonth,
} from '@/lib/meterEstimation';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import classNames from 'classnames';
import { motion, AnimatePresence } from 'motion/react';
import {
  PageHeader,
  DataTable,
  Section,
  InsightBanner,
  AccentPanel,
  StatusPill,
  EmptyState,
  type DataTableColumn,
} from '@/components/design';
import {
  Zap,
  Droplets,
  Flame,
  MapPin,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bot,
  PlusCircle,
  Sparkles,
  Calendar,
  Gauge,
  Building2,
  Replace,
  ClipboardCheck,
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

function getChartData(
  meter: Meter,
  selectedYear: number,
  getPreviousYearValue: (meterId: number, month: number, currentYear: number) => number | null,
) {
  const result = [];
  for (let m = 1; m <= 12; m++) {
    const cyData = meter.readings.find((r: MeterReading) => r.month === m && r.year === selectedYear);
    const pyData = getPreviousYearValue(meter.id, m, selectedYear);
    result.push({
      monthName: MONTH_NAMES[m - 1],
      idei: cyData ? cyData.consumption : null,
      tavalyi: pyData !== null ? pyData : null,
    });
  }
  return result;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md bg-popover border border-border px-3 py-2 shadow-md">
        <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <div className="flex flex-col gap-1">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
              <span className="text-foreground/70">{entry.name}:</span>
              <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
                {formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const getMeterMeta = (name: string) => {
  if (name.includes('Villany'))
    return {
      Icon: Zap,
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
      surface: 'from-amber-50/70 via-amber-50/20',
      bar: 'bg-gradient-to-b from-amber-400 to-orange-500',
      accent: 'oklch(0.72 0.16 60)',
    };
  if (name.includes('Víz'))
    return {
      Icon: Droplets,
      iconBg: 'bg-gradient-to-br from-sky-400 to-cyan-500 text-white',
      surface: 'from-sky-50/70 via-sky-50/20',
      bar: 'bg-gradient-to-b from-sky-400 to-cyan-500',
      accent: 'oklch(0.62 0.16 200)',
    };
  if (name.includes('Gáz'))
    return {
      Icon: Flame,
      iconBg: 'bg-gradient-to-br from-rose-400 to-orange-500 text-white',
      surface: 'from-rose-50/70 via-rose-50/20',
      bar: 'bg-gradient-to-b from-rose-400 to-orange-500',
      accent: 'oklch(0.62 0.22 25)',
    };
  return {
    Icon: Gauge,
    iconBg: 'bg-gradient-to-br from-primary to-violet-500 text-white',
    surface: 'from-primary/8 via-primary/2',
    bar: 'bg-gradient-to-b from-primary to-violet-500',
    accent: 'oklch(0.55 0.22 275)',
  };
};

function MeterPanel({
  meter,
  selectedYear,
  getPreviousYearValue,
  onAiClick,
  onEditReading,
  onAddReading,
  onDeleteMeter,
  onDeleteReading,
}: {
  meter: Meter;
  selectedYear: number;
  getPreviousYearValue: (meterId: number, month: number, currentYear: number) => number | null;
  onAiClick: (id: number) => void;
  onEditReading: (m: Meter, r: MeterReading) => void;
  onAddReading: (m: Meter) => void;
  onDeleteMeter: (id: number) => void;
  onDeleteReading: (mId: number, rId: number) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const { user } = useAuthStore();
  const isReader = user?.role === 'reader';
  const [calcValue, setCalcValue] = useState('');
  const { addMeterReading } = useMetersStore();

  const chartData = getChartData(meter, selectedYear, getPreviousYearValue);
  const meta = getMeterMeta(meter.name);
  const { Icon, iconBg, surface, bar, accent } = meta;

  const yearReadings = meter.readings
    .filter((r: MeterReading) => r.year === selectedYear)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const otherReadings = meter.readings
    .filter((r: MeterReading) => r.year !== selectedYear)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayReadings = showFullHistory ? [...yearReadings, ...otherReadings] : yearReadings;

  const sortedAllReadings = [...meter.readings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const latestReading = sortedAllReadings[0];
  const currentVal = parseFloat(calcValue);
  const diff = latestReading && !isNaN(currentVal) ? currentVal - latestReading.value : 0;

  const sortedOfficialReadings = [...meter.readings]
    .filter((r) => r.isOfficial || r.is_official)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestOfficialReading = sortedOfficialReadings[0];
  const consumptionSinceOfficial =
    latestReading && latestOfficialReading ? latestReading.value - latestOfficialReading.value : null;

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
      isEstimated: false,
    });
    setCalcValue('');
  };

  const yearTotal = yearReadings.reduce((s, r) => s + r.consumption, 0);
  const prevYearTotal = meter.readings.filter((r) => r.year === selectedYear - 1).reduce((s, r) => s + r.consumption, 0);
  const trend = prevYearTotal > 0 ? ((yearTotal - prevYearTotal) / prevYearTotal) * 100 : null;

  const readingColumns: DataTableColumn<MeterReading>[] = [
    {
      key: 'value',
      header: 'Állás',
      width: '24%',
      cell: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className={classNames('flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white shadow-sm', iconBg)}>
            <Gauge size={13} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground tabular-nums">
              {formatNumber(r.value)}
              <span className="text-[0.7rem] font-normal text-muted-foreground ml-1">{meter.unit}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Dátum',
      width: '16%',
      cell: (r) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Calendar size={10} strokeWidth={2.2} /> {formatDate(r.date)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Típus',
      width: '30%',
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          {(r.isOfficial || r.is_official) && (
            <StatusPill status="success" size="xs">
              <Building2 size={9} /> szolgáltató leolvasta
            </StatusPill>
          )}
          {(r.isReset || r.is_reset) && (
            <StatusPill status="danger" size="xs">
              <RefreshCw size={9} /> csere
            </StatusPill>
          )}
          {(r.isEstimated || r.is_estimated) && (
            <StatusPill status="primary" size="xs">
              <Bot size={9} /> AI becslés
            </StatusPill>
          )}
          {!(r.isOfficial || r.is_official) && !(r.isReset || r.is_reset) && !(r.isEstimated || r.is_estimated) && (
            <span className="text-[0.7rem] text-muted-foreground/70">saját rögzítés</span>
          )}
        </div>
      ),
    },
    {
      key: 'consumption',
      header: 'Fogyasztás',
      align: 'right',
      width: '18%',
      cell: (r) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          +{formatNumber(r.consumption)}
          <span className="text-[0.65rem] font-normal text-muted-foreground ml-1">{meter.unit}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '12%',
      cell: (r) =>
        !isReader ? (
          <div className="flex items-center justify-end gap-0.5">
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={() => onEditReading(meter, r)}>
              <Edit3 size={13} />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => onDeleteReading(meter.id, r.id)}>
              <Trash2 size={13} />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      className="rounded-lg border border-border bg-card overflow-hidden shadow-soft hover:shadow-lift transition-shadow flex"
    >
      <div className={classNames('w-[3px] shrink-0', bar)} />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className={classNames('flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 bg-gradient-to-br to-transparent', surface)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={classNames('h-11 w-11 shrink-0 rounded-lg flex items-center justify-center shadow-sm', iconBg)}>
              <Icon size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-foreground leading-tight truncate">{meter.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <span className="font-medium">{meter.unit}</span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={10} strokeWidth={2.2} /> {meter.location}
                </span>
              </div>
            </div>
          </div>
          {!isReader && (
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={() => onAddReading(meter)}>
                <PlusCircle size={13} /> Leolvasás
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAiClick(meter.id)}>
                <Sparkles size={13} /> AI
              </Button>
              <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onDeleteMeter(meter.id)}>
                <Trash2 size={13} />
              </Button>
            </div>
          )}
        </header>

      {/* KPI row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="px-5 py-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Idei összes</p>
          <p className="text-lg font-semibold tabular-nums text-foreground mt-1">
            {formatNumber(yearTotal)}
            <span className="text-xs text-muted-foreground font-normal ml-1">{meter.unit}</span>
          </p>
          {trend !== null && (
            <p className={classNames('text-[0.65rem] mt-0.5 font-medium tabular-nums', trend < 0 ? 'text-emerald-600' : trend > 0 ? 'text-rose-600' : 'text-muted-foreground')}>
              {trend > 0 ? '+' : ''}
              {trend.toFixed(1)}% vs tavaly
            </p>
          )}
        </div>
        <div className="px-5 py-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Tavalyi összes</p>
          <p className="text-lg font-semibold tabular-nums text-muted-foreground mt-1">
            {formatNumber(prevYearTotal)}
            <span className="text-xs font-normal ml-1">{meter.unit}</span>
          </p>
          <p className="text-[0.65rem] mt-0.5 text-muted-foreground/70">{selectedYear - 1} teljes év</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-primary">Szolgáltatói leolvasás óta</p>
          {consumptionSinceOfficial !== null && latestOfficialReading ? (
            <>
              <p className="text-lg font-semibold tabular-nums text-foreground mt-1">
                {formatNumber(consumptionSinceOfficial)}
                <span className="text-xs text-muted-foreground font-normal ml-1">{meter.unit}</span>
              </p>
              <p className="text-[0.65rem] mt-0.5 text-muted-foreground/70">{formatDate(latestOfficialReading.date)} óta</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Még nem volt szolgáltatói helyszíni leolvasás</p>
          )}
        </div>
      </div>

      {/* Quick capture calculator */}
      {latestReading && !isReader && (
        <div className="border-b border-border px-5 py-3 bg-muted/20">
          <form onSubmit={handleSaveCalc} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px] flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Új állás:
              </span>
              <span>utolsó: {formatNumber(latestReading.value)} {meter.unit} · {formatDate(latestReading.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Aktuális állás"
                  value={calcValue}
                  onChange={(e) => setCalcValue(e.target.value)}
                  className="w-40 h-8 text-xs"
                />
                {calcValue && (
                  <span className={classNames('absolute -bottom-4 left-0 text-[0.65rem] font-medium tabular-nums', diff >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                    {diff >= 0 ? `+${formatNumber(diff)}` : formatNumber(diff)} {meter.unit}
                    {diff < 0 ? ' · kisebb!' : ''}
                  </span>
                )}
              </div>
              <Button type="submit" size="sm" disabled={!calcValue || isNaN(currentVal) || diff < 0}>
                Rögzítés
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Chart */}
      <div className="border-b border-border px-2 py-3">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorIdei-${meter.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.25} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.004 250)" />
            <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'oklch(0.50 0.012 260)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'oklch(0.50 0.012 260)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="tavalyi"
              stroke="oklch(0.65 0.012 260)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="transparent"
              name={`${selectedYear - 1}`}
            />
            <Area
              type="monotone"
              dataKey="idei"
              stroke={accent}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#colorIdei-${meter.id})`}
              name={`${selectedYear}`}
              activeDot={{ r: 4, fill: accent, stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Readings toggle */}
      <button
        type="button"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <Calendar size={12} strokeWidth={2.2} />
          {meter.readings.length} leolvasás összesen · {yearReadings.length} idén
        </span>
        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence initial={false}>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border"
          >
            {displayReadings.length === 0 ? (
              <EmptyState icon={Gauge} title="Nincs leolvasás" description="Még nincs rögzített állás ebben az időszakban." className="m-4" />
            ) : (
              <>
                <div className="p-4">
                  <DataTable
                    columns={readingColumns}
                    data={displayReadings}
                    rowKey={(r) => r.id}
                    minWidth="640px"
                    className="!shadow-none !border-border/70"
                    dense
                  />
                </div>
                {otherReadings.length > 0 && !showFullHistory && (
                  <button
                    onClick={() => setShowFullHistory(true)}
                    className="w-full px-5 py-2.5 text-xs font-medium text-primary hover:bg-muted/40 transition-colors border-t border-border"
                  >
                    További {otherReadings.length} leolvasás megjelenítése…
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default function MetersPage() {
  const { user } = useAuthStore();
  const metersSettings = useMemo(() => resolveMetersSettings(user?.household), [user?.household]);
  const isReader = user?.role === 'reader';
  const { meters, addMeter, deleteMeter, addMeterReading, updateMeterReading, deleteMeterReading } = useMetersStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { aiUtilityAnomalies, fetchAiUtilityAnomalies } = useUtilitiesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<{ meter: Meter; reading: MeterReading } | null>(null);

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
  const [newMeterUnit, setNewMeterUnit] = useState(metersSettings.units[0] ?? 'kWh');
  const [newMeterLoc, setNewMeterLoc] = useState(metersSettings.default_location);

  const openNewMeterModal = () => {
    setNewMeterName('');
    setNewMeterUnit(metersSettings.units[0] ?? 'kWh');
    setNewMeterLoc(metersSettings.default_location);
    setIsNewMeterModalOpen(true);
  };

  const applyMeterTemplate = (template: (typeof metersSettings.templates)[number]) => {
    setNewMeterName(template.name);
    setNewMeterUnit(template.unit);
    setNewMeterLoc(template.location || metersSettings.default_location);
  };

  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

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
    setIsModalOpen(false);
    setValue('');
    setIsReset(false);
    setIsOfficial(false);
  };

  const openEdit = (m: Meter, r: MeterReading) => {
    setEditingReading({ meter: m, reading: r });
    setMeterId(m.id);
    setDate(r.date);
    setValue(r.value.toString());
    setIsReset(r.isReset);
    setIsOfficial(r.isOfficial || false);
    setIsModalOpen(true);
  };

  const getPreviousYearValue = (mId: number, month: number, year: number): number | null => {
    const meter = meters.find((m) => m.id === mId);
    if (!meter) return null;
    const py = meter.readings.find((r) => r.month === month && r.year === year - 1);
    return py ? py.consumption : null;
  };

  const estimateOneMonth = async (meter: Meter, year: number, month: number): Promise<boolean> => {
    const targetDateStr = targetDateForMonth(year, month);
    const targetDate = new Date(targetDateStr);
    const sortedReadings = sortReadingsByDate(meter.readings);

    if (sortedReadings.some((r) => r.year === year && r.month === month)) {
      return false;
    }

    const immediatePrev = sortedReadings.filter((r) => new Date(r.date) < targetDate).at(-1) ?? null;
    if (!immediatePrev) {
      alert('Nincs korábbi leolvasás, amihez a becslést rögzíteni lehetne.');
      return false;
    }

    const { previous: prevAnchor, next: nextAnchor } = bracketAnchorReadings(sortedReadings, targetDate);

    if (
      prevAnchor &&
      nextAnchor &&
      canInterpolateBetween(prevAnchor, nextAnchor)
    ) {
      const value = interpolateMeterValue(prevAnchor, nextAnchor, targetDateStr);
      await addMeterReading(meter.id, {
        date: targetDateStr,
        month,
        year,
        value,
        isReset: false,
        isEstimated: true,
      });
      return true;
    }

    const prevYearSameMonth = getPreviousYearValue(meter.id, month, year);
    const historicalReadings = sortedReadings
      .filter((r) => isAnchorReading(r) && new Date(r.date) < targetDate)
      .map((r) => ({ month: r.month, consumption: Math.max(0, r.consumption) }));
    const monthSeries = historicalReadings
      .map((r) => `${r.month}. hónap: ${r.consumption}`)
      .join(', ');

    const prompt = `Becsüld meg egy közműóra (${meter.name}) havi fogyasztását (kWh vagy ${meter.unit}, különbség az előző és jelen állás között).
Célhónap: ${year}-${String(month).padStart(2, '0')}
Múlt év azonos hónapja: ${prevYearSameMonth !== null ? prevYearSameMonth : 'nincs'}
Korábbi havi fogyasztások (csak saját rögzítés): ${monthSeries || 'nincs'}

Válasz: egyetlen egész szám, semmi más.`;

    let estimatedConsumption: number;
    try {
      const res = await aiFinanceClient.query(prompt, false);
      const parsed = parseAiConsumption(res.data.answer);
      estimatedConsumption =
        parsed !== null
          ? parsed
          : seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
    } catch {
      estimatedConsumption = seasonalConsumptionEstimate(historicalReadings, month, prevYearSameMonth);
    }
    estimatedConsumption = Math.max(1, estimatedConsumption);

    await addMeterReading(meter.id, {
      date: targetDateStr,
      month,
      year,
      value: immediatePrev.value + estimatedConsumption,
      isReset: false,
      isEstimated: true,
    });
    return true;
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const meter = meters.find((m) => m.id === aiTargetMeter);
    if (!meter) return;
    setIsAiLoading(true);
    try {
      const ok = await estimateOneMonth(meter, aiYear, aiMonth);
      if (!ok) {
        alert('Erre a hónapra már van leolvasás. Becslés csak hiányzó hónapra készíthető.');
        return;
      }
      setIsAiModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Hiba a becslés során. Ellenőrizd a hálózatot és az OPENAI_API_KEY beállítást.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFillAllGaps = async () => {
    const meter = meters.find((m) => m.id === aiTargetMeter);
    if (!meter) return;
    const gaps = listAllGapMonthsBetweenAnchors(sortReadingsByDate(meter.readings));
    if (gaps.length === 0) {
      alert('Nincs kitölthető hiány: legalább két saját rögzítésű leolvasás között lehet interpolálni.');
      return;
    }
    setIsAiLoading(true);
    try {
      for (const gap of gaps) {
        const targetDateStr = targetDateForMonth(gap.year, gap.month);
        const value = interpolateMeterValue(gap.prev, gap.next, targetDateStr);
        await addMeterReading(meter.id, {
          date: targetDateStr,
          month: gap.month,
          year: gap.year,
          value,
          isReset: false,
          isEstimated: true,
        });
      }
      setIsAiModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Hiba a hiányzó hónapok kitöltésekor.');
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
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Közmű' }, { label: 'Mérőórák' }]}
        title="Óraállások és trendek"
        description="Mérőóra állások, fogyasztás és AI-alapú becslések."
        actions={
          !isReader ? (
            <Button size="sm" onClick={openNewMeterModal}>
              <PlusCircle size={13} /> Új mérőóra
            </Button>
          ) : undefined
        }
      />

      {!!aiUtilityAnomalies?.anomalies?.length && (
        <AccentPanel
          tone="warning"
          icon={Sparkles}
          title="AI anomáliák ezen a hónapon"
          titleInfo={HELP.meters.aiAnomaly}
          description="A modell az alábbi szokatlan értékeket észlelte"
          action={
            <Button variant="ghost" size="xs" onClick={() => fetchAiUtilityAnomalies(selectedYear, selectedMonth)}>
              <RefreshCw size={11} /> Frissítés
            </Button>
          }
        >
          <ul className="space-y-1.5">
            {aiUtilityAnomalies.anomalies.map((a: { meter_id: number; meter_name: string; actual: number; expected: number; reason: string }) => (
              <li key={`${a.meter_id}-${a.actual}`} className="text-foreground/80 flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <b className="font-medium text-foreground">{a.meter_name}</b>: {a.reason}
                </span>
              </li>
            ))}
          </ul>
        </AccentPanel>
      )}

      {Object.keys(locationGroups).length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="Még nincs mérőóra"
          description="Adj hozzá egy mérőórát az óraállások és fogyasztás követéséhez."
          action={
            !isReader ? (
              <Button size="sm" onClick={openNewMeterModal}>
                <PlusCircle size={13} /> Új mérőóra
              </Button>
            ) : undefined
          }
        />
      ) : (
        Object.keys(locationGroups).map((loc) => (
          <Section
            key={loc}
            title={
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" />
                {loc}
              </span>
            }
            description={`${locationGroups[loc].length} mérőóra`}
          >
            <div className="flex flex-col gap-4">
              {locationGroups[loc].map((meter) => (
                <MeterPanel
                  key={meter.id}
                  meter={meter}
                  selectedYear={selectedYear}
                  getPreviousYearValue={getPreviousYearValue}
                  onAiClick={(id) => {
                    setAiTargetMeter(id);
                    setIsAiModalOpen(true);
                  }}
                  onEditReading={openEdit}
                  onAddReading={(m) => {
                    setEditingReading(null);
                    setMeterId(m.id);
                    setValue('');
                    setDate(new Date().toISOString().split('T')[0]);
                    setIsReset(false);
                    setIsOfficial(false);
                    setIsModalOpen(true);
                  }}
                  onDeleteMeter={(id) => {
                    const m = meters.find((x) => x.id === id);
                    requestDelete({
                      title: 'Mérőóra törlése',
                      message: `Biztosan törlöd a „${m?.name ?? 'mérőóra'}" mérőórát az összes állással együtt? Ez a művelet nem vonható vissza.`,
                      onConfirm: () => deleteMeter(id),
                    });
                  }}
                  onDeleteReading={(mId, rId) => {
                    requestDelete({
                      title: 'Leolvasás törlése',
                      message: 'Biztosan törlöd ezt az óraállást? A fogyasztási adatok újraszámolásra kerülnek.',
                      onConfirm: () => deleteMeterReading(mId, rId),
                    });
                  }}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingReading ? 'Leolvasás szerkesztése' : 'Mérőóra rögzítése'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.meterSelect}>Melyik mérőóra?</FieldLabel>
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
              value={meterId}
              onChange={(e) => setMeterId(Number(e.target.value))}
              disabled={!!editingReading}
            >
              <option value={0} disabled>Válassz mérőórát…</option>
              {meters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.location})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.readingDate}>Dátum</FieldLabel>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.readingValue}>Mérőóra állás</FieldLabel>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2.5">
            <ToggleOptionCard
              checked={isReset}
              onCheckedChange={setIsReset}
              icon={Replace}
              title="Óracsere történt"
              description="Új mérő került felszerelésre; a fogyasztás ettől a ponttól újraszámolódik."
              iconClassName="bg-rose-500/15 text-rose-600 dark:text-rose-400"
              activeClassName="border-rose-500/25 ring-rose-500/10"
            />
            <ToggleOptionCard
              checked={isOfficial}
              onCheckedChange={setIsOfficial}
              icon={ClipboardCheck}
              title="Szolgáltató leolvasta"
              description="A szolgáltató kint járt és helyszínen leolvasta az órát — nem saját rögzítés."
              iconClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              activeClassName="border-emerald-500/25 ring-emerald-500/10"
            />
          </div>
          <Button type="submit" className="mt-1">
            Mentés
          </Button>
        </form>
      </Modal>

      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI fogyasztás-becslés" icon={<Sparkles size={16} />}>
        <form onSubmit={handleAiSubmit} className="flex flex-col gap-4">
          <InsightBanner tone="ai">
            Két saját rögzítés között az óraállás időarányosan kerül kitöltésre (nem ismétlődik ugyanaz az érték).
            A legutolsó ismert pont után az AI becsli a havi fogyasztást.
          </InsightBanner>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.meters.estimateYear}>Év</FieldLabel>
              <Input type="number" value={aiYear} onChange={(e) => setAiYear(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.meters.estimateMonth}>Hónap</FieldLabel>
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={aiMonth}
                onChange={(e) => setAiMonth(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {m}. hónap
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            <Button type="submit" disabled={isAiLoading}>
              {isAiLoading && <RefreshCw size={14} className="animate-spin" />}
              {isAiLoading ? 'Becslés…' : 'Egy hónap becslése'}
            </Button>
            <Button type="button" variant="outline" disabled={isAiLoading} onClick={handleFillAllGaps}>
              Összes hiány kitöltése (két saját rögzítés között)
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNewMeterModalOpen} onClose={() => setIsNewMeterModalOpen(false)} title="Új mérőóra hozzáadása">
        <form onSubmit={handleMeterSubmit} className="flex flex-col gap-4">
          {metersSettings.templates.length > 0 && (
            <div className="space-y-2">
              <FieldLabel info="Sablonok a Beállítások → Modulok → Közműórák alól">Gyors sablon</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {metersSettings.templates.map((template) => (
                  <Button
                    key={`${template.name}-${template.unit}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyMeterTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.newMeterName}>Megnevezés</FieldLabel>
            <Input placeholder="pl. Villanyóra, Vízóra (Nappali)" value={newMeterName} onChange={(e) => setNewMeterName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.meters.newMeterUnit}>Mértékegység</FieldLabel>
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={newMeterUnit}
                onChange={(e) => setNewMeterUnit(e.target.value)}
              >
                {metersSettings.units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.meters.newMeterLocation}>Helyszín</FieldLabel>
              <Input value={newMeterLoc} onChange={(e) => setNewMeterLoc(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="mt-1">
            Mérőóra létrehozása
          </Button>
        </form>
      </Modal>

      <ConfirmDeleteModal />
    </div>
  );
}
