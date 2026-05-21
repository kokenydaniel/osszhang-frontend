'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { InsightBanner } from '@/components/design';
import { RefreshCw, Sparkles } from 'lucide-react';
import type { MetersPageState } from '@/components/modules/meters/hooks/use-meters-page-state';

type MetersAiModalProps = Pick<
  MetersPageState,
  | 'isAiModalOpen'
  | 'setIsAiModalOpen'
  | 'isAiLoading'
  | 'aiYear'
  | 'setAiYear'
  | 'aiMonth'
  | 'setAiMonth'
  | 'handleAiSubmit'
  | 'handleFillAllGaps'
>;

export function MetersAiModal({
  isAiModalOpen,
  setIsAiModalOpen,
  isAiLoading,
  aiYear,
  setAiYear,
  aiMonth,
  setAiMonth,
  handleAiSubmit,
  handleFillAllGaps,
}: MetersAiModalProps) {
  return (
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
  );
}
