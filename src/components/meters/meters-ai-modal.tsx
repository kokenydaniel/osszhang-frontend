'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/config/help';
import { InsightBanner } from '@/components/design';
import { Sparkles, RefreshCw } from 'lucide-react';

type AiFormValues = {
  aiYear: number;
  aiMonth: number;
};

type MetersAiModalProps = {
  open: boolean;
  meterId: number;
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
  onEstimateMonth: (year: number, month: number) => Promise<void>;
  onFillAllGaps: (meterId: number) => Promise<void>;
};

export function MetersAiModal({
  open,
  meterId,
  initialYear,
  initialMonth,
  onClose,
  onEstimateMonth,
  onFillAllGaps,
}: MetersAiModalProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<AiFormValues>({
    defaultValues: { aiYear: initialYear, aiMonth: initialMonth },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ aiYear: initialYear, aiMonth: initialMonth });
  }, [open, initialYear, initialMonth, form]);

  const runEstimate = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await onEstimateMonth(values.aiYear, values.aiMonth);
      onClose();
    } catch {
      form.setError('root', { message: 'Hiba a becslés során.' });
    } finally {
      setLoading(false);
    }
  });

  const handleFillGaps = async () => {
    setLoading(true);
    try {
      await onFillAllGaps(meterId);
      onClose();
    } catch {
      form.setError('root', { message: 'Hiba a hiányzó hónapok kitöltésekor.' });
    } finally {
      setLoading(false);
    }
  };

  const { register, formState } = form;

  return (
    <Modal isOpen={open} onClose={onClose} title="AI fogyasztás-becslés" icon={<Sparkles size={16} />}>
      <form onSubmit={runEstimate} className="flex flex-col gap-4">
        {formState.errors.root?.message ? (
          <p className="text-sm text-destructive">{formState.errors.root.message}</p>
        ) : null}

        <InsightBanner tone="ai">
          Két saját rögzítés között az óraállás időarányosan kerül kitöltésre. A legutolsó ismert pont után az AI becsli a havi fogyasztást.
        </InsightBanner>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.estimateYear}>Év</FieldLabel>
            <Input type="number" {...register('aiYear', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.meters.estimateMonth}>Hónap</FieldLabel>
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
              {...register('aiMonth', { valueAsNumber: true })}
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
          <Button type="submit" disabled={loading}>
            {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
            {loading ? 'Becslés…' : 'Egy hónap becslése'}
          </Button>
          <Button type="button" variant="outline" disabled={loading} onClick={() => void handleFillGaps()}>
            Összes hiány kitöltése (két saját rögzítés között)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
