'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { InsightBanner } from '@/components/design';
import { RefreshCw } from 'lucide-react';

interface MetersAiFormProps {
  aiYear: number;
  onAiYearChange: (year: number) => void;
  aiMonth: number;
  onAiMonthChange: (month: number) => void;
  isAiLoading: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onFillAllGaps: () => void;
}

export function MetersAiForm({
  aiYear,
  onAiYearChange,
  aiMonth,
  onAiMonthChange,
  isAiLoading,
  onSubmit,
  onFillAllGaps,
}: MetersAiFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <InsightBanner tone="ai">
        Két saját rögzítés között az óraállás időarányosan kerül kitöltésre (nem ismétlődik ugyanaz az érték).
        A legutolsó ismert pont után az AI becsli a havi fogyasztást.
      </InsightBanner>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.estimateYear}>Év</FieldLabel>
          <Input type="number" value={aiYear} onChange={(e) => onAiYearChange(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.meters.estimateMonth}>Hónap</FieldLabel>
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            value={aiMonth}
            onChange={(e) => onAiMonthChange(Number(e.target.value))}
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
        <Button type="button" variant="outline" disabled={isAiLoading} onClick={onFillAllGaps}>
          Összes hiány kitöltése (két saját rögzítés között)
        </Button>
      </div>
    </form>
  );
}
