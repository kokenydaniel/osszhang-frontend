'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/DatePicker';
import { ModalFormFooter } from '@/components/design';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LabelWithInfo } from '@/components/ui/InfoTooltip';
import { OptionsSelect } from '@/components/ui/OptionsSelect';
import { HELP } from '@/config/help';
import type { BusinessSettings } from '@/settings/business';
import { Switch } from '@/components/ui/switch';
import { User, Banknote } from 'lucide-react';

export type BusinessOrderFormValues = {
  orderDate: string;
  customer: string;
  amount: string;
  channel: string;
  payment: string;
  provider: string;
  destination: string;
  paidDate: string;
  hasInvoice: boolean;
  invoiceId: string;
};

type BusinessOrderFormProps = {
  form: UseFormReturn<BusinessOrderFormValues>;
  bizOptions: BusinessSettings;
  isEdit: boolean;
  onCancel: () => void;
  onSubmit: ReturnType<UseFormReturn<BusinessOrderFormValues>['handleSubmit']>;
};

export function BusinessOrderForm({ form, bizOptions, isEdit, onCancel, onSubmit }: BusinessOrderFormProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const hasInvoice = watch('hasInvoice');
  const invoiceId = watch('invoiceId');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.orderDate}>Dátum</FieldLabel>
          <Controller
            name="orderDate"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.customer}>Vevő neve</FieldLabel>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8"
              {...register('customer', { required: true })}
              placeholder="pl. Tóth Tímea"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.orderAmount}>Összeg (Ft)</FieldLabel>
          <div className="relative">
            <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input type="number" className="pl-8" {...register('amount', { required: true })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.channel}>Csatorna</FieldLabel>
          <Controller
            name="channel"
            control={control}
            render={({ field }) => <OptionsSelect value={field.value} onChange={field.onChange} options={bizOptions.channels} />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.paymentMethod}>Fizetés módja</FieldLabel>
          <Controller
            name="payment"
            control={control}
            render={({ field }) => (
              <OptionsSelect value={field.value} onChange={field.onChange} options={bizOptions.payment_methods} />
            )}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.provider}>Szolgáltató</FieldLabel>
          <Controller
            name="provider"
            control={control}
            render={({ field }) => <OptionsSelect value={field.value} onChange={field.onChange} options={bizOptions.providers} />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.destination}>Hová érkezik</FieldLabel>
          <Controller
            name="destination"
            control={control}
            render={({ field }) => (
              <OptionsSelect value={field.value} onChange={field.onChange} options={bizOptions.destinations} />
            )}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
        <LabelWithInfo className="text-xs font-medium" info={HELP.business.paymentSection}>
          Kifizetés és számla
        </LabelWithInfo>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">Számla vagy nyugta készült</p>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              AAM / dokumentált bevétel kimutatásnál ez számít bevételnek (vagy ha van sorszám).
            </p>
          </div>
          <Switch
            checked={hasInvoice || Boolean(invoiceId.trim())}
            onCheckedChange={(checked) => setValue('hasInvoice', checked)}
            aria-label="Bizonylat készült"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.business.paidDateBiz}>
              Kifizetés dátuma
            </FieldLabel>
            <Controller
              name="paidDate"
              control={control}
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.business.invoiceNumber}>
              Számla sorszáma
            </FieldLabel>
            <Input {...register('invoiceId')} placeholder="E-LL-2026-XX" />
          </div>
        </div>
      </div>

      <ModalFormFooter
        onCancel={onCancel}
        submitLabel={isEdit ? 'Mentés' : 'Adatok rögzítése'}
        loading={isSubmitting}
      />
    </form>
  );
}
