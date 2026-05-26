'use client';

import { formatHUF } from '@/utils';
import { DatePicker } from '@/components/ui/DatePicker';
import { ModalFormFooter, ObjectDetails } from '@/components/design';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
import { Banknote, RefreshCw, Wallet } from 'lucide-react';
import { DebtsService } from '@/services/DebtsService';
import type { Debt } from '@/types';

interface DebtsPayFormProps {
  payDebt: Debt | null;
  payAmount: string;
  onPayAmountChange: (value: string) => void;
  payDate: string;
  onPayDateChange: (value: string) => void;
  payNote: string;
  onPayNoteChange: (value: string) => void;
  payAddToBudget: boolean;
  onPayAddToBudgetChange: (value: boolean) => void;
  payCategory: string;
  onPayCategoryChange: (value: string) => void;
  paySaving: boolean;
  categories: string[];
  selectedYear: number;
  selectedMonth: number;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}

export function DebtsPayForm({
  payDebt,
  payAmount,
  onPayAmountChange,
  payDate,
  onPayDateChange,
  payNote,
  onPayNoteChange,
  payAddToBudget,
  onPayAddToBudgetChange,
  payCategory,
  onPayCategoryChange,
  paySaving,
  categories,
  selectedYear,
  selectedMonth,
  onSubmit,
  onCancel,
}: DebtsPayFormProps) {
  const remaining = payDebt ? DebtsService.remaining(payDebt) : 0;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {payDebt ? (
        <ObjectDetails
          compact
          columns={2}
          groups={[
            {
              items: [
                { label: 'Hátralévő', value: formatHUF(remaining) },
                { label: 'Eredeti összeg', value: formatHUF(Number(payDebt.targetAmount)) },
                {
                  label: 'Havi minimum',
                  value: payDebt.minimumPayment ? formatHUF(Number(payDebt.minimumPayment)) : '—',
                },
                {
                  label: 'Kamat',
                  value: payDebt.annualInterestRate ? `${payDebt.annualInterestRate}% / év` : '—',
                },
              ],
            },
          ]}
          className="rounded-md border border-border bg-muted/20 px-3 py-3"
        />
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.payAmount}>Összeg (Ft)</FieldLabel>
          <Input
            type="number"
            step="any"
            placeholder="0"
            value={payAmount}
            onChange={(e) => onPayAmountChange(e.target.value)}
            required
          />
          {payDebt?.minimumPayment &&
            Number(payAmount) > 0 &&
            Number(payAmount) !== Number(payDebt.minimumPayment) && (
              <p className="text-[0.7rem] text-muted-foreground">
                Eltér a havi részlettől ({formatHUF(payDebt.minimumPayment)})
              </p>
            )}
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.payDate}>Dátum</FieldLabel>
          <DatePicker value={payDate} onChange={onPayDateChange} />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel info={HELP.debts.payNote}>Megjegyzés</FieldLabel>
        <Input
          placeholder="pl. Júniusi részlet"
          value={payNote}
          onChange={(e) => onPayNoteChange(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-border bg-gradient-to-br from-primary/[0.04] to-card p-3.5 space-y-3">
        <p className="text-[0.72rem] text-muted-foreground leading-snug">{HELP.debts.payBudget}</p>
        <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={payAddToBudget}
            onChange={(e) => onPayAddToBudgetChange(e.target.checked)}
          />
          <span className="inline-flex items-center gap-1.5">
            <Wallet size={14} className="text-primary" />
            <span className="font-medium">Költségvetésbe is rögzítem</span>
            <InfoTooltip content={HELP.debts.payBudget} />
          </span>
        </label>
        {payAddToBudget && (
          <div className="space-y-1.5 pl-7">
            <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.debts.payCategory}>
              Kategória
            </FieldLabel>
            {categories.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                Még nincs kategória. Hozz létre egyet a Beállításokban.
              </p>
            ) : (
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={payCategory}
                onChange={(e) => onPayCategoryChange(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[0.7rem] text-muted-foreground">
              Egy „kifizetve" státuszú kiadás-tételt rögzít a {selectedYear}.{' '}
              {String(selectedMonth).padStart(2, '0')}. hónapra.
            </p>
          </div>
        )}
      </div>

      <ModalFormFooter
        onCancel={onCancel}
        submitLabel="Befizetés rögzítése"
        submitIcon={paySaving ? <RefreshCw size={13} className="animate-spin" /> : <Banknote size={13} />}
        loading={paySaving}
      />
    </form>
  );
}
