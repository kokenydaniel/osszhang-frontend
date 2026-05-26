'use client';

import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LabelWithInfo } from '@/components/ui/InfoTooltip';
import { OptionsSelect } from '@/components/ui/OptionsSelect';
import { HELP } from '@/lib/helpTexts';
import type { BusinessSettings } from '@/lib/businessSettings';
import { User, Banknote, Sparkles } from 'lucide-react';

export interface BusinessOrderFormProps {
  orderDate: string;
  onOrderDateChange: (value: string) => void;
  customer: string;
  onCustomerChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  channel: string;
  onChannelChange: (value: string) => void;
  payment: string;
  onPaymentChange: (value: string) => void;
  provider: string;
  onProviderChange: (value: string) => void;
  destination: string;
  onDestinationChange: (value: string) => void;
  paidDate: string;
  onPaidDateChange: (value: string) => void;
  invoiceId: string;
  onInvoiceIdChange: (value: string) => void;
  bizOptions: BusinessSettings;
  onSubmit: (event: React.FormEvent) => void;
  saving?: boolean;
}

export function BusinessOrderForm({
  orderDate,
  onOrderDateChange,
  customer,
  onCustomerChange,
  amount,
  onAmountChange,
  channel,
  onChannelChange,
  payment,
  onPaymentChange,
  provider,
  onProviderChange,
  destination,
  onDestinationChange,
  paidDate,
  onPaidDateChange,
  invoiceId,
  onInvoiceIdChange,
  bizOptions,
  onSubmit,
  saving,
}: BusinessOrderFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.orderDate}>Dátum</FieldLabel>
          <DatePicker value={orderDate} onChange={onOrderDateChange} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.customer}>Vevő neve</FieldLabel>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8"
              value={customer}
              onChange={(event) => onCustomerChange(event.target.value)}
              required
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
            <Input
              type="number"
              className="pl-8"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.channel}>Csatorna</FieldLabel>
          <OptionsSelect value={channel} onChange={onChannelChange} options={bizOptions.channels} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.paymentMethod}>Fizetés módja</FieldLabel>
          <OptionsSelect value={payment} onChange={onPaymentChange} options={bizOptions.payment_methods} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.provider}>Szolgáltató</FieldLabel>
          <OptionsSelect value={provider} onChange={onProviderChange} options={bizOptions.providers} />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel info={HELP.business.destination}>Hová érkezik</FieldLabel>
        <OptionsSelect value={destination} onChange={onDestinationChange} options={bizOptions.destinations} />
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
        <LabelWithInfo className="text-xs font-medium" info={HELP.business.paymentSection}>
          Kifizetés és számla
        </LabelWithInfo>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.business.paidDateBiz}>
              Kifizetés dátuma
            </FieldLabel>
            <DatePicker value={paidDate} onChange={onPaidDateChange} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.business.invoiceNumber}>
              Számla sorszáma
            </FieldLabel>
            <Input
              value={invoiceId}
              onChange={(event) => onInvoiceIdChange(event.target.value)}
              placeholder="E-LL-2026-XX"
            />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-1 w-full" loading={saving}>
        {!saving && <Sparkles size={14} />} {saving ? 'Feldolgozás…' : 'Adatok rögzítése'}
      </Button>
    </form>
  );
}
