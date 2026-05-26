'use client';

import { Modal } from '@/components/ui/Modal';
import { useBusinessUi } from '@/components/modules/business/BusinessUiContext';
import { BusinessOrderForm } from '@/components/modules/business/business-order-form';
import type { BusinessSettings } from '@/lib/businessSettings';

interface BusinessOrderModalProps {
  bizOptions: BusinessSettings;
  onSubmit: (event: React.FormEvent) => void;
  saving?: boolean;
}

export function BusinessOrderModal({ bizOptions, onSubmit, saving }: BusinessOrderModalProps) {
  const ui = useBusinessUi();

  return (
    <Modal
      isOpen={ui.isModalOpen}
      onClose={ui.closeOrderForm}
      title={ui.editId ? 'Rendelés szerkesztése' : 'Új rendelés'}
      size="lg"
    >
      <BusinessOrderForm
        orderDate={ui.orderDate}
        onOrderDateChange={ui.setOrderDate}
        customer={ui.customer}
        onCustomerChange={ui.setCustomer}
        amount={ui.amount}
        onAmountChange={ui.setAmount}
        channel={ui.channel}
        onChannelChange={ui.setChannel}
        payment={ui.payment}
        onPaymentChange={ui.setPayment}
        provider={ui.provider}
        onProviderChange={ui.setProvider}
        destination={ui.destination}
        onDestinationChange={ui.setDestination}
        paidDate={ui.paidDate}
        onPaidDateChange={ui.setPaidDate}
        invoiceId={ui.invoiceId}
        onInvoiceIdChange={ui.setInvoiceId}
        bizOptions={bizOptions}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}
