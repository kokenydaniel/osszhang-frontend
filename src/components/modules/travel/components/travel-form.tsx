'use client';

import { AccentPanel } from '@/components/design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { DatePicker } from '@/components/ui/DatePicker';
import { Loader2, MapPinned, Sparkles } from 'lucide-react';

interface TravelFormProps {
  destination: string;
  durationDays: string;
  totalBudget: string;
  targetDate: string;
  isGenerating: boolean;
  onDestinationChange: (value: string) => void;
  onDurationDaysChange: (value: string) => void;
  onTotalBudgetChange: (value: string) => void;
  onTargetDateChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function TravelForm({
  destination,
  durationDays,
  totalBudget,
  targetDate,
  isGenerating,
  onDestinationChange,
  onDurationDaysChange,
  onTotalBudgetChange,
  onTargetDateChange,
  onSubmit,
}: TravelFormProps) {
  return (
    <AccentPanel tone="ai" icon={MapPinned} title="Utazás paraméterei" description="Add meg az úti célt, időtartamot, költségkeretet és a tervezett dátumot">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
          <FieldLabel>Úti cél</FieldLabel>
          <Input
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="pl. Ibiza, Róma, Balaton"
            required
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Napok száma</FieldLabel>
          <Input
            type="number"
            min={1}
            max={90}
            value={durationDays}
            onChange={(e) => onDurationDaysChange(e.target.value)}
            required
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Költségkeret (Ft)</FieldLabel>
          <Input
            type="number"
            min={1000}
            step={1000}
            value={totalBudget}
            onChange={(e) => onTotalBudgetChange(e.target.value)}
            placeholder="500000"
            required
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Tervezett utazás dátuma</FieldLabel>
          <DatePicker value={targetDate} onChange={onTargetDateChange} disabled={isGenerating} required />
        </div>
        <div className="md:col-span-2 xl:col-span-4">
          <Button type="submit" disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? 'Terv generálása…' : 'AI utazástervezés indítása'}
          </Button>
        </div>
      </form>
    </AccentPanel>
  );
}
