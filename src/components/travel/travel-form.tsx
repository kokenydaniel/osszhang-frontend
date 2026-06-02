'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { AccentPanel } from '@/components/design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { DatePicker } from '@/components/ui/DatePicker';
import type { TravelFormInput } from '@/hooks/useTravelPageData';
import { Loader2, MapPinned, Sparkles } from 'lucide-react';

type TravelFormProps = {
  form: UseFormReturn<TravelFormInput>;
  isGenerating: boolean;
  onSubmit: ReturnType<UseFormReturn<TravelFormInput>['handleSubmit']>;
};

export function TravelForm({ form, isGenerating, onSubmit }: TravelFormProps) {
  const { register, control } = form;

  return (
    <AccentPanel
      tone="ai"
      icon={MapPinned}
      title="Utazás paraméterei"
      description="Add meg az úti célt, időtartamot, költségkeretet és a tervezett dátumot"
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
          <FieldLabel>Úti cél</FieldLabel>
          <Input
            {...register('destination', { required: true })}
            placeholder="pl. Ibiza, Róma, Balaton"
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Napok száma</FieldLabel>
          <Input
            type="number"
            min={1}
            max={90}
            {...register('durationDays', { required: true })}
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Költségkeret (Ft)</FieldLabel>
          <Input
            type="number"
            min={1000}
            step={1000}
            {...register('totalBudget', { required: true })}
            placeholder="500000"
            disabled={isGenerating}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Tervezett utazás dátuma</FieldLabel>
          <Controller
            name="targetDate"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} disabled={isGenerating} />
            )}
          />
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
