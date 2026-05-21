'use client';

import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LabelWithInfo } from '@/components/ui/InfoTooltip';
import { OptionsSelect } from '@/components/ui/OptionsSelect';
import { HELP } from '@/lib/helpTexts';
import { User, Banknote, Sparkles } from 'lucide-react';
import type { BusinessPageState } from '@/components/modules/business/hooks/use-business-page-state';

type BusinessOrderModalProps = Pick<
  BusinessPageState,
  | 'isModalOpen'
  | 'setIsModalOpen'
  | 'editId'
  | 'orderDate'
  | 'setOrderDate'
  | 'customer'
  | 'setCustomer'
  | 'amount'
  | 'setAmount'
  | 'channel'
  | 'setChannel'
  | 'payment'
  | 'setPayment'
  | 'provider'
  | 'setProvider'
  | 'destination'
  | 'setDestination'
  | 'paidDate'
  | 'setPaidDate'
  | 'invoiceId'
  | 'setInvoiceId'
  | 'bizOptions'
  | 'handleSubmit'
>;

export function BusinessOrderModal({
  isModalOpen,
  setIsModalOpen,
  editId,
  orderDate,
  setOrderDate,
  customer,
  setCustomer,
  amount,
  setAmount,
  channel,
  setChannel,
  payment,
  setPayment,
  provider,
  setProvider,
  destination,
  setDestination,
  paidDate,
  setPaidDate,
  invoiceId,
  setInvoiceId,
  bizOptions,
  handleSubmit,
}: BusinessOrderModalProps) {
  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Rendelés szerkesztése' : 'Új rendelés'} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.business.orderDate}>Dátum</FieldLabel>
            <DatePicker value={orderDate} onChange={setOrderDate} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.business.customer}>Vevő neve</FieldLabel>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input className="pl-8" value={customer} onChange={(e) => setCustomer(e.target.value)} required placeholder="pl. Tóth Tímea" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.business.orderAmount}>Összeg (Ft)</FieldLabel>
            <div className="relative">
              <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input type="number" className="pl-8" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.business.channel}>Csatorna</FieldLabel>
            <OptionsSelect value={channel} onChange={setChannel} options={bizOptions.channels} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.business.paymentMethod}>Fizetés módja</FieldLabel>
            <OptionsSelect value={payment} onChange={setPayment} options={bizOptions.payment_methods} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.business.provider}>Szolgáltató</FieldLabel>
            <OptionsSelect value={provider} onChange={setProvider} options={bizOptions.providers} />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel info={HELP.business.destination}>Hová érkezik</FieldLabel>
          <OptionsSelect value={destination} onChange={setDestination} options={bizOptions.destinations} />
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
              <DatePicker value={paidDate} onChange={setPaidDate} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.business.invoiceNumber}>
                Számla sorszáma
              </FieldLabel>
              <Input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="E-LL-2026-XX" />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-1">
          <Sparkles size={14} /> Adatok rögzítése
        </Button>
      </form>
    </Modal>
  );
}
