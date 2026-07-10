'use client';

import { useState } from 'react';
import { formatNumber } from '@/utils';
import { Meter, MeterReading } from '@/types';
import { formatDate, compareDates } from '@/utils';
import { Button } from '@/components/ui/button';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { Input } from '@/components/ui/input';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import classNames from 'classnames';
import { motion, AnimatePresence } from 'motion/react';
import {
  DataTable,
  StatusPill,
  EmptyState,
  type DataTableColumn,
} from '@/components/design';
import {
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
  CheckSquare,
  Square,
} from 'lucide-react';
import { CustomTooltip } from './meter-chart-tooltip';
import { metersCalculations } from '@/calculations/meters';

export function MeterPanel({
  meter,
  selectedYear,
  getPreviousYearValue,
  isReader,
  onQuickReadingSubmit,
  onAiClick,
  onEditReading,
  onAddReading,
  onDeleteMeter,
  onDeleteReading,
  onDeleteReadingsBulk,
}: {
  meter: Meter;
  selectedYear: number;
  getPreviousYearValue: (meterId: number, month: number, currentYear: number) => number | null;
  isReader: boolean;
  onQuickReadingSubmit: (meterId: number, value: string) => void;
  onAiClick: (id: number) => void;
  onEditReading: (m: Meter, r: MeterReading) => void;
  onAddReading: (m: Meter) => void;
  onDeleteMeter: (id: number) => void;
  onDeleteReading: (mId: number, rId: number) => void;
  onDeleteReadingsBulk: (mId: number, rIds: number[]) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [calcValue, setCalcValue] = useState('');
  const [selectedReadingIds, setSelectedReadingIds] = useState<Set<number>>(new Set());

  const toggleReadingSelection = (id: number) => {
    setSelectedReadingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (readings: MeterReading[]) => {
    if (selectedReadingIds.size === readings.length) {
      setSelectedReadingIds(new Set());
    } else {
      setSelectedReadingIds(new Set(readings.map((r) => r.id)));
    }
  };

  const chartData = metersCalculations.buildChartData(meter, selectedYear, getPreviousYearValue);
  const meta = metersCalculations.getMeterMeta(meter.name);
  const { Icon, iconBg, surface, bar, accent } = meta;
  const { yearTotal, prevYearTotal, trend } = metersCalculations.buildYearTotals(meter, selectedYear);
  const { latestReading, latestOfficialReading, consumptionSinceOfficial } =
    metersCalculations.buildConsumptionSinceOfficial(meter);
  const officialComparison = metersCalculations.buildOfficialPeriodsComparison(meter);
  const prediction = metersCalculations.buildNextOfficialPrediction(meter);

  const yearReadings = meter.readings
    .filter((r: MeterReading) => r.year === selectedYear)
    .sort((a, b) => compareDates(b.date, a.date));
  const otherReadings = meter.readings
    .filter((r: MeterReading) => r.year !== selectedYear)
    .sort((a, b) => compareDates(b.date, a.date));
  const displayReadings = showFullHistory ? [...yearReadings, ...otherReadings] : yearReadings;

  const currentVal = parseFloat(calcValue);
  const diff = latestReading && !isNaN(currentVal) ? metersCalculations.computeQuickReadingDiff(latestReading.value, currentVal) : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveCalc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcValue || isNaN(currentVal) || diff < 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onQuickReadingSubmit(meter.id, calcValue);
      setCalcValue('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const readingColumns: DataTableColumn<MeterReading>[] = [
    {
      key: 'select',
      header: '',
      width: '5%',
      cell: (r) =>
        !isReader ? (
          <button
            type="button"
            onClick={() => toggleReadingSelection(r.id)}
            className="text-muted-foreground hover:text-primary transition-colors"
            title={selectedReadingIds.has(r.id) ? 'Kijelölés törlése' : 'Kijelölés'}
          >
            {selectedReadingIds.has(r.id) ? (
              <CheckSquare size={15} strokeWidth={2} className="text-primary" />
            ) : (
              <Square size={15} strokeWidth={2} />
            )}
          </button>
        ) : null,
    },
    {
      key: 'value',
      header: 'Állás',
      width: '22%',
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
          {(r.is_official || r.is_official) && (
            <StatusPill status="success" size="xs">
              <Building2 size={9} /> szolgáltató leolvasta
            </StatusPill>
          )}
          {(r.is_reset || r.is_reset) && (
            <StatusPill status="danger" size="xs">
              <RefreshCw size={9} /> csere
            </StatusPill>
          )}
          {(r.is_estimated || r.is_estimated) && (
            <StatusPill status="primary" size="xs">
              <Bot size={9} /> AI becslés
            </StatusPill>
          )}
          {!(r.is_official || r.is_official) && !(r.is_reset || r.is_reset) && !(r.is_estimated || r.is_estimated) && (
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
              <TierGatedButton
                feature="ai"
                featureLabel="AI fogyasztás-becslés"
                size="sm"
                variant="outline"
                onClick={() => onAiClick(meter.id)}
              >
                <Sparkles size={13} /> AI
              </TierGatedButton>
              <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onDeleteMeter(meter.id)}>
                <Trash2 size={13} />
              </Button>
            </div>
          )}
        </header>

        <div className={classNames('grid divide-x divide-border border-b border-border', officialComparison ? 'grid-cols-4' : 'grid-cols-3')}>
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
          {officialComparison && (
            <div className="px-5 py-3 bg-primary/5">
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-primary">
                {new Date(officialComparison.currentPeriod.end.date).getFullYear()}. évi elszámolás
              </p>
              <p className="text-lg font-semibold tabular-nums text-foreground mt-1">
                {formatNumber(officialComparison.currentPeriod.consumption)}
                <span className="text-xs text-muted-foreground font-normal ml-1">{meter.unit}</span>
              </p>
              {officialComparison.previousPeriod ? (
                <p className="text-[0.65rem] mt-0.5 text-muted-foreground/80 tabular-nums">
                  {new Date(officialComparison.previousPeriod.end.date).getFullYear()}. évi: {formatNumber(officialComparison.previousPeriod.consumption)} {meter.unit}
                  {officialComparison.trend !== null && (
                    <span className={classNames('ml-1 font-medium', officialComparison.trend < 0 ? 'text-emerald-600' : officialComparison.trend > 0 ? 'text-rose-600' : '')}>
                      ({officialComparison.trend > 0 ? '+' : ''}{officialComparison.trend.toFixed(1)}%)
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-[0.65rem] mt-0.5 text-muted-foreground/70">Nincs korábbi elszámolás</p>
              )}
            </div>
          )}
          <div className="px-5 py-3">
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Leolvasás óta</p>
            {consumptionSinceOfficial !== null && latestOfficialReading ? (
              <>
                <p className="text-lg font-semibold tabular-nums text-foreground mt-1">
                  {formatNumber(consumptionSinceOfficial)}
                  <span className="text-xs text-muted-foreground font-normal ml-1">{meter.unit}</span>
                </p>
                <p className="text-[0.65rem] mt-0.5 text-muted-foreground/70">{formatDate(latestOfficialReading.date)} óta</p>
                
                {prediction && (
                  <p className={classNames('text-[0.65rem] mt-1.5 font-medium tabular-nums', 
                    prediction.trend !== null 
                      ? (prediction.trend <= 0 ? 'text-emerald-600' : 'text-rose-600') 
                      : 'text-muted-foreground')}>
                    Várható: ~{formatNumber(prediction.predictedConsumption)} {meter.unit}
                    {prediction.trend !== null && (
                      <span> ({prediction.trend <= 0 ? 'kevesebb' : 'több'})</span>
                    )}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">Nincs még hivatalos</p>
            )}
          </div>
        </div>

        {latestReading && !isReader && (
          <div className="border-b border-border px-5 py-3 bg-muted/20">
            <form onSubmit={handleSaveCalc} className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px] flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Új állás:
                </span>
                <span>
                  utolsó: {formatNumber(latestReading.value)} {meter.unit} · {formatDate(latestReading.date)}
                </span>
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
                <Button type="submit" size="sm" disabled={!calcValue || isNaN(currentVal) || diff < 0} loading={isSubmitting}>
                  Rögzítés
                </Button>
              </div>
            </form>
          </div>
        )}

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

        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
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
                  {!isReader && (
                    <div className="flex items-center justify-between px-4 pt-3 pb-1 gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectAll(displayReadings)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {selectedReadingIds.size === displayReadings.length && displayReadings.length > 0 ? (
                          <CheckSquare size={13} className="text-primary" />
                        ) : (
                          <Square size={13} />
                        )}
                        {selectedReadingIds.size === displayReadings.length && displayReadings.length > 0
                          ? 'Kijelölés megszüntetése'
                          : 'Összes kijelölése'}
                      </button>
                      {selectedReadingIds.size > 0 && (
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => {
                            onDeleteReadingsBulk(meter.id, Array.from(selectedReadingIds));
                            setSelectedReadingIds(new Set());
                          }}
                          className="gap-1.5"
                        >
                          <Trash2 size={11} />
                          {selectedReadingIds.size} törlése
                        </Button>
                      )}
                    </div>
                  )}
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
