'use client';

import { Modal } from '@/components/ui/Modal';
import { useDebtsUi } from '@/components/modules/debts/DebtsUiContext';
import { DebtsForm } from '@/components/modules/debts/debts-form';

interface DebtsFormModalProps {
  onSubmit: (event: React.FormEvent) => void;
  saving?: boolean;
}

export function DebtsFormModal({ onSubmit, saving }: DebtsFormModalProps) {
  const ui = useDebtsUi();

  return (
    <Modal
      isOpen={ui.isDebtFormOpen}
      onClose={ui.closeDebtForm}
      title={ui.editId ? 'Tartozás szerkesztése' : 'Új tartozás'}
      description="Add meg az aktuális hátralékot, kamatot és a havi részletet. Ezek alapján számítjuk a lejáratot."
    >
      <DebtsForm
        editId={ui.editId}
        name={ui.name}
        onNameChange={ui.setName}
        targetAmount={ui.targetAmount}
        onTargetAmountChange={ui.setTargetAmount}
        paidAmount={ui.paidAmount}
        onPaidAmountChange={ui.setPaidAmount}
        annualInterestRate={ui.annualInterestRate}
        onAnnualInterestRateChange={ui.setAnnualInterestRate}
        minimumPayment={ui.minimumPayment}
        onMinimumPaymentChange={ui.setMinimumPayment}
        dueDay={ui.dueDay}
        onDueDayChange={ui.setDueDay}
        onSubmit={onSubmit}
        onCancel={ui.closeDebtForm}
        saving={saving}
      />
    </Modal>
  );
}
