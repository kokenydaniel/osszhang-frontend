'use client';

import { ModalFormFooter } from '@/components/design';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/lib/helpTexts';

interface DebtsFormProps {
  editId: number | null;
  name: string;
  onNameChange: (value: string) => void;
  targetAmount: string;
  onTargetAmountChange: (value: string) => void;
  paidAmount: string;
  onPaidAmountChange: (value: string) => void;
  annualInterestRate: string;
  onAnnualInterestRateChange: (value: string) => void;
  minimumPayment: string;
  onMinimumPaymentChange: (value: string) => void;
  dueDay: string;
  onDueDayChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function DebtsForm({
  editId,
  name,
  onNameChange,
  targetAmount,
  onTargetAmountChange,
  paidAmount,
  onPaidAmountChange,
  annualInterestRate,
  onAnnualInterestRateChange,
  minimumPayment,
  onMinimumPaymentChange,
  dueDay,
  onDueDayChange,
  onSubmit,
  onCancel,
  saving,
}: DebtsFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <FieldLabel info={HELP.debts.name}>Megnevezés</FieldLabel>
        <Input
          placeholder="pl. Lakáshitel, Autóhitel, Hitelkártya"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.targetAmount}>Eredeti összeg (Ft)</FieldLabel>
          <Input
            type="number"
            placeholder="0"
            value={targetAmount}
            onChange={(e) => onTargetAmountChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.paidAmount}>Eddig törlesztve (Ft)</FieldLabel>
          <Input
            type="number"
            placeholder="0"
            value={paidAmount}
            onChange={(e) => onPaidAmountChange(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        <FormField
          label="Éves kamat (%)"
          info={HELP.debts.interestRate}
          hint="A lejárat számításához kell — THM-hez közeli érték."
        >
          <Input
            type="number"
            step="0.01"
            placeholder="pl. 7.5"
            value={annualInterestRate}
            onChange={(e) => onAnnualInterestRateChange(e.target.value)}
          />
        </FormField>
        <FormField
          label="Havi részlet (Ft)"
          info={HELP.debts.minimumPayment}
          hint="A bank által előírt havi törlesztő — ha kisebb a kamatnál, a tartozás nem csökken."
        >
          <Input
            type="number"
            placeholder="0"
            value={minimumPayment}
            onChange={(e) => onMinimumPaymentChange(e.target.value)}
          />
        </FormField>
        <FormField label="Esedékesség napja" info={HELP.debts.dueDay}>
          <Input
            type="number"
            min={1}
            max={31}
            placeholder="1-31"
            value={dueDay}
            onChange={(e) => onDueDayChange(e.target.value)}
          />
        </FormField>
      </div>
      <ModalFormFooter
        onCancel={onCancel}
        submitLabel={editId ? 'Mentés' : 'Létrehozás'}
        loading={saving}
      />
    </form>
  );
}
