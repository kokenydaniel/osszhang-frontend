'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { utilitiesClient } from '@/lib/api-client';
import { utilitiesCalculations } from '@/calculations/utilities';
import { StatusCodes } from '@/types/api';
import type { UtilityBill } from '@/types';
import type { UtilitiesIndex } from '@/types/utilities';
import { Copy, LayoutTemplate, Plus } from 'lucide-react';

interface ActionButtonsProps {
  bills: UtilitiesIndex['bills'];
  selectedMonth: number;
  selectedYear: number;
  onOpenNewBill: () => void;
  onRefresh: () => void;
}

export function UtilitiesActionButtons({
  bills,
  selectedMonth,
  selectedYear,
  onOpenNewBill,
  onRefresh,
}: ActionButtonsProps) {
  const user = useAuthStore.getState().user;
  const templates = utilitiesCalculations.resolveTemplates(user?.household);

  return (
    <>
      <ClonePreviousMonthButton month={selectedMonth} year={selectedYear} onRefresh={onRefresh} />
      {templates.length > 0 && (
        <GenerateFromTemplatesButton
          bills={bills}
          templates={templates}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onRefresh={onRefresh}
        />
      )}
      <NewBillButton onOpenNewBill={onOpenNewBill} />
    </>
  );
}

function NewBillButton({ onOpenNewBill }: { onOpenNewBill: () => void }) {
  return (
    <Button size="sm" onClick={onOpenNewBill}>
      <Plus size={13} /> Új rögzítés
    </Button>
  );
}

function ClonePreviousMonthButton({
  month,
  year,
  onRefresh,
}: {
  month: number;
  year: number;
  onRefresh: () => void;
}) {
  const [cloning, setCloning] = useState(false);
  const { addNotification } = useNotificationStore();

  const handleClone = async () => {
    setCloning(true);
    try {
      const res = await utilitiesClient.cloneMonth(month, year);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      addNotification('Előző hónap másolva.', 'success');
      onRefresh();
    } catch {
      addNotification('A másolás nem sikerült.', 'error');
    } finally {
      setCloning(false);
    }
  };

  return (
    <Button variant="outline" size="sm" loading={cloning} onClick={() => void handleClone()}>
      {!cloning && <Copy size={13} />} {cloning ? 'Másolás…' : 'Múlt havi'}
    </Button>
  );
}

function GenerateFromTemplatesButton({
  bills,
  templates,
  selectedMonth,
  selectedYear,
  onRefresh,
}: {
  bills: UtilityBill[];
  templates: ReturnType<typeof utilitiesCalculations.resolveTemplates>;
  selectedMonth: number;
  selectedYear: number;
  onRefresh: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const { addNotification } = useNotificationStore();

  const handleGenerate = async () => {
    setGenerating(true);
    const targetMonth = selectedMonth.toString().padStart(2, '0');
    const targetYearMonth = `${selectedYear}-${targetMonth}`;
    let created = 0;

    for (const template of templates) {
      if (utilitiesCalculations.templateExistsForMonth(bills, template.type, targetYearMonth)) continue;
      try {
        const payload = utilitiesCalculations.buildTemplateBillPayload(template, selectedYear, selectedMonth);
        const res = await utilitiesClient.create(payload as any);
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) throw new Error('API Error');
        created += 1;
      } catch (error) {
        console.error('[UtilitiesActionButtons] template bill failed', error);
      }
    }

    addNotification(
      created > 0 ? `${created} sablon tétel létrehozva.` : 'Minden sablon már szerepel ebben a hónapban.',
      created > 0 ? 'success' : 'info',
    );
    if (created > 0) onRefresh();
    setGenerating(false);
  };

  return (
    <Button variant="outline" size="sm" loading={generating} onClick={() => void handleGenerate()}>
      {!generating && <LayoutTemplate size={13} />} {generating ? 'Generálás…' : 'Sablonból'}
    </Button>
  );
}
