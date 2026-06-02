'use client';

import type { UseFormReturn } from 'react-hook-form';
import { formatHUF } from '@/utils';
import { DatePicker } from '@/components/ui/DatePicker';
import { ModalFormFooter, ObjectDetails } from '@/components/design';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/config/help';
import { Banknote, RefreshCw, Wallet } from 'lucide-react';
import { debtsCalculations } from '@/calculations/debts';
import type { Debt } from '@/types';

export type DebtPayFormValues = {
  payAmount: string;
  payDate: string;
  payNote: string;
  payAddToBudget: boolean;
  payCategory: string;
};

type DebtPayFormProps = {
  form: UseFormReturn<DebtPayFormValues>;
  debt: Debt;
  categories: string[];
  selectedYear: number;
  selectedMonth: number;
  onCancel: () => void;
  onSubmit: ReturnType<UseFormReturn<DebtPayFormValues>['handleSubmit']>;
};

export function DebtPayForm({
  form,
  debt,
  categories,
  selectedYear,
  selectedMonth,
  onCancel,
  onSubmit,
}: DebtPayFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const payAddToBudget = watch('payAddToBudget');
  const payAmount = watch('payAmount');
  const remaining = debtsCalculations.remaining(debt);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}
      <ObjectDetails
        compact
        columns={2}
        groups={[
          {
            items: [
              { label: 'Hátralévő', value: formatHUF(remaining) },
              { label: 'Eredeti összeg', value: formatHUF(Number(debt.targetAmount)) },
              {
                label: 'Havi minimum',
                value: debt.minimumPayment ? formatHUF(Number(debt.minimumPayment)) : '—',
              },
              {
                label: 'Kamat',
                value: debt.annualInterestRate ? `${debt.annualInterestRate}% / év` : '—',
              },
            ],
          },
        ]}
        className="rounded-md border border-border bg-muted/20 px-3 py-3"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.payAmount}>Összeg (Ft)</FieldLabel>
          <Input
            type="number"
            step="any"
            placeholder="0"
            {...register('payAmount', { required: 'Kötelező mező' })}
          />
          {debt.minimumPayment &&
            Number(payAmount) > 0 &&
            Number(payAmount) !== Number(debt.minimumPayment) && (
              <p className="text-[0.7rem] text-muted-foreground">
                Eltér a havi részlettől ({formatHUF(debt.minimumPayment)})
              </p>
            )}
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.payDate}>Dátum</FieldLabel>
          <DatePicker value={watch('payDate')} onChange={(value) => setValue('payDate', value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <FieldLabel info={HELP.debts.payNote}>Megjegyzés</FieldLabel>
        <Input placeholder="pl. Júniusi részlet" {...register('payNote')} />
      </div>
      <div className="rounded-md border border-border bg-gradient-to-br from-primary/[0.04] to-card p-3.5 space-y-3">
        <p className="text-[0.72rem] text-muted-foreground leading-snug">{HELP.debts.payBudget}</p>
        <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
          <input type="checkbox" className="h-4 w-4 accent-primary" {...register('payAddToBudget')} />
          <span className="inline-flex items-center gap-1.5">
            <Wallet size={14} className="text-primary" />
            <span className="font-medium">Költségvetésbe is rögzítem</span>
            <InfoTooltip content={HELP.debts.payBudget} />
          </span>
        </label>
        {payAddToBudget ? (
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
                {...register('payCategory', { required: payAddToBudget ? 'Válassz kategóriát' : false })}
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
        ) : null}
      </div>
      <ModalFormFooter
        onCancel={onCancel}
        submitLabel="Befizetés rögzítése"
        submitIcon={isSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Banknote size={13} />}
        loading={isSubmitting}
      />
    </form>
  );
}
