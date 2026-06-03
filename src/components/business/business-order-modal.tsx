'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { today } from '@/utils/dates';
import { businessCalculations } from '@/calculations/business';
import {
  pickDefaultChannel,
  pickDefaultDestination,
  pickDefaultPayment,
  pickDefaultProvider,
  pickDefaultOrderStatus,
  type BusinessSettings,
} from '@/settings/business';
import type { BusinessOrder, CreateBusinessOrderPayload } from '@/types/business';
import { BusinessOrderForm, type BusinessOrderFormValues } from './business-order-form';

type BusinessOrderModalProps = {
  open: boolean;
  order: BusinessOrder | null;
  bizOptions: BusinessSettings;
  onClose: () => void;
  onSave: (payload: CreateBusinessOrderPayload, editId: number | null) => Promise<void>;
};

function emptyValues(bizOptions: BusinessSettings): BusinessOrderFormValues {
  return {
    orderDate: today(),
    customer: '',
    amount: '',
    channel: pickDefaultChannel(bizOptions),
    payment: pickDefaultPayment(bizOptions),
    provider: pickDefaultProvider(bizOptions),
    destination: pickDefaultDestination(bizOptions),
    paidDate: '',
    hasInvoice: false,
    invoiceId: '',
  };
}

function orderToValues(order: BusinessOrder, bizOptions: BusinessSettings): BusinessOrderFormValues {
  return {
    orderDate: order.date || today(),
    customer: order.customerName || '',
    amount: String(order.amount || ''),
    channel: order.channel || pickDefaultChannel(bizOptions),
    payment: order.paymentMethod || pickDefaultPayment(bizOptions),
    provider: order.provider || pickDefaultProvider(bizOptions),
    destination: order.destination || pickDefaultDestination(bizOptions),
    paidDate: order.paidDate || '',
    hasInvoice: Boolean(order.hasInvoice) || Boolean(order.invoiceId?.trim()),
    invoiceId: order.invoiceId || '',
  };
}

function toPayload(
  values: BusinessOrderFormValues,
  order: BusinessOrder | null,
  bizOptions: BusinessSettings,
): CreateBusinessOrderPayload {
  const paidDate = values.paidDate.trim() || null;
  return {
    date: values.orderDate,
    customerName: values.customer.trim(),
    channel: values.channel,
    paymentMethod: values.payment,
    provider: values.provider,
    destination: values.destination,
    amount: Number(values.amount),
    paidDate,
    hasInvoice: values.hasInvoice || Boolean(values.invoiceId.trim()),
    invoiceId: values.invoiceId.trim(),
    state: businessCalculations.deriveOrderState(paidDate),
    orderStatus: order?.orderStatus || pickDefaultOrderStatus(bizOptions),
  };
}

export function BusinessOrderModal({ open, order, bizOptions, onClose, onSave }: BusinessOrderModalProps) {
  const isEdit = order !== null;
  const form = useForm<BusinessOrderFormValues>({
    defaultValues: emptyValues(bizOptions),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(order ? orderToValues(order, bizOptions) : emptyValues(bizOptions));
  }, [open, order, bizOptions, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!values.amount.trim() || !values.customer.trim()) return;

    try {
      await onSave(toPayload(values, order, bizOptions), order?.id ?? null);
      onClose();
    } catch {
      form.setError('root', { message: 'A rendelés mentése nem sikerült.' });
    }
  });

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Rendelés szerkesztése' : 'Új rendelés'}
      size="lg"
    >
      <BusinessOrderForm
        form={form}
        bizOptions={bizOptions}
        isEdit={isEdit}
        onCancel={onClose}
        onSubmit={submit}
      />
    </Modal>
  );
}
