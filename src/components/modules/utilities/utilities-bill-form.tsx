'use client';

import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FieldHint } from '@/components/ui/FieldHint';
import { FormChoiceCard } from '@/components/ui/FormChoiceCard';
import { HELP } from '@/lib/helpTexts';
import type { UtilitySplitRule } from '@/types';
import type { UtilitySettlementOption } from '@/services/UtilitiesService';

export interface UtilitiesBillFormProps {
  editingBill: { id: number } | null;
  utilitySplitEnabled: boolean;
  type: string;
  onTypeChange: (value: string) => void;
  total: string;
  onTotalChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  splitRule: UtilitySplitRule;
  onSplitRuleChange: (rule: UtilitySplitRule) => void;
  settlementOptions: UtilitySettlementOption[];
  householdSideLabel: string;
  partnerSideLabel: string;
  onSubmit: (event: React.FormEvent) => void;
  saving?: boolean;
}

export function UtilitiesBillForm({
  editingBill,
  utilitySplitEnabled,
  type,
  onTypeChange,
  total,
  onTotalChange,
  dueDate,
  onDueDateChange,
  splitRule,
  onSplitRuleChange,
  settlementOptions,
  householdSideLabel,
  partnerSideLabel,
  onSubmit,
  saving,
}: UtilitiesBillFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <FieldLabel info={HELP.utilities.billType}>Típus</FieldLabel>
        <Input value={type} onChange={(e) => onTypeChange(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <FieldLabel info={HELP.utilities.billAmount}>Végösszeg</FieldLabel>
        <Input type="number" value={total} onChange={(e) => onTotalChange(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <FieldLabel info={HELP.utilities.billDue}>Határidő</FieldLabel>
        <DatePicker value={dueDate} onChange={onDueDateChange} />
      </div>
      {utilitySplitEnabled && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Ki fizeti ezt a számlát?</p>
          <FieldHint className="-mt-1">
            A választás alapján számolódik a havi rezsi-mérleg ({householdSideLabel} ↔ {partnerSideLabel}).
          </FieldHint>
          <div className="grid gap-2" role="radiogroup" aria-label="Elszámolás módja">
            {settlementOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <FormChoiceCard
                  key={opt.id}
                  selected={splitRule === opt.id}
                  onSelect={() => onSplitRuleChange(opt.id)}
                  title={opt.title}
                  description={opt.description}
                  example={opt.example}
                  icon={Icon}
                />
              );
            })}
          </div>
        </div>
      )}
      <Button type="submit" className="mt-1 w-full" loading={saving}>
        {saving ? 'Feldolgozás…' : editingBill ? 'Mentés' : 'Rögzítés'}
      </Button>
    </form>
  );
}
