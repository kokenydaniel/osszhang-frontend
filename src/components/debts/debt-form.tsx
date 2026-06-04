'use client';

import type { UseFormReturn } from 'react-hook-form';
import { ModalFormFooter } from '@/components/design';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { MiniSwitch } from '@/components/design';
import { HELP } from '@/config/help';

export type DebtFormValues = {
  name: string;
  targetAmount: string;
  paidAmount: string;
  annualInterestRate: string;
  minimumPayment: string;
  dueDay: string;
  budgetSyncEnabled: boolean;
  budgetStartMonth: string;
};

type DebtFormProps = {
  form: UseFormReturn<DebtFormValues>;
  isEdit: boolean;
  onCancel: () => void;
  onSubmit: ReturnType<UseFormReturn<DebtFormValues>['handleSubmit']>;
  typeTemplates?: Array<{ label: string; default_interest_rate_annual: number }>;
};

export function DebtForm({
  form,
  isEdit,
  onCancel,
  onSubmit,
  typeTemplates = [],
}: DebtFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const budgetSyncEnabled = watch('budgetSyncEnabled');
  const minimumPayment = watch('minimumPayment');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}
      <div className="space-y-1.5">
        <FieldLabel info={HELP.debts.name}>Megnevezés</FieldLabel>
        <Input
          placeholder="pl. Lakáshitel, Autóhitel, Hitelkártya"
          {...register('name', { required: 'Kötelező mező' })}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        {!isEdit && typeTemplates.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {typeTemplates.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                className="rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-medium hover:border-primary/40"
                onClick={() => {
                  setValue('name', tpl.label);
                  if (tpl.default_interest_rate_annual > 0) {
                    setValue('annualInterestRate', String(tpl.default_interest_rate_annual));
                  }
                }}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.targetAmount}>Eredeti összeg (Ft)</FieldLabel>
          <Input
            type="number"
            placeholder="0"
            {...register('targetAmount', { required: 'Kötelező mező' })}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.paidAmount}>Eddig törlesztve (Ft)</FieldLabel>
          <Input type="number" placeholder="0" {...register('paidAmount')} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        <FormField
          label="Éves kamat (%)"
          info={HELP.debts.interestRate}
          hint="A lejárat számításához kell — THM-hez közeli érték."
        >
          <Input type="number" step="0.01" placeholder="pl. 7.5" {...register('annualInterestRate')} />
        </FormField>
        <FormField
          label="Havi részlet (Ft)"
          info={HELP.debts.minimumPayment}
          hint="A bank által előírt havi törlesztő — ha kisebb a kamatnál, a tartozás nem csökken."
        >
          <Input type="number" placeholder="0" {...register('minimumPayment')} />
        </FormField>
        <FormField label="Esedékesség napja" info={HELP.debts.dueDay}>
          <Input type="number" min={1} max={31} placeholder="1-31" {...register('dueDay')} />
        </FormField>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-3">
        <MiniSwitch
          checked={budgetSyncEnabled}
          onChange={(checked) => setValue('budgetSyncEnabled', checked)}
          label="Költségvetésbe szinkron"
          title="A havi részlet megjelenik a cashflow kiadások között"
          disabled={!minimumPayment}
        />
        {budgetSyncEnabled && minimumPayment ? (
          <FormField label="Szinkron indulása (hónap)" hint="Ettől a hónaptól jelenik meg a költségvetésben.">
            <Input type="month" {...register('budgetStartMonth', { required: 'Kötelező ha szinkron be van kapcsolva' })} />
          </FormField>
        ) : null}
      </div>

      <ModalFormFooter
        onCancel={onCancel}
        submitLabel={isEdit ? 'Mentés' : 'Létrehozás'}
        loading={isSubmitting}
      />
    </form>
  );
}
