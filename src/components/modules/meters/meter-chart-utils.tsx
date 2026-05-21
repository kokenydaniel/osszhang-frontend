import { formatNumber } from '@/utils';
import { Meter, MeterReading } from '@/types';
import { Zap, Droplets, Flame, Gauge } from 'lucide-react';

export const MONTH_NAMES = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

export function getChartData(
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

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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

export const getMeterMeta = (name: string) => {
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
