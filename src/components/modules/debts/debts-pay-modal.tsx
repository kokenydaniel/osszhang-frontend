'use client';

import { formatHUF } from '@/utils';
import { Modal } from '@/components/ui/Modal';
import { useDebtsUi } from '@/components/modules/debts/DebtsUiContext';
import { DebtsPayForm } from '@/components/modules/debts/debts-pay-form';
import { DebtsService } from '@/services/DebtsService';

interface DebtsPayModalProps {
  categories: string[];
  selectedYear: number;
  selectedMonth: number;
  onSubmit: (event: React.FormEvent) => void;
}

export function DebtsPayModal({ categories, selectedYear, selectedMonth, onSubmit }: DebtsPayModalProps) {
  const ui = useDebtsUi();
  const remaining = ui.payDebt ? DebtsService.remaining(ui.payDebt) : 0;

  return (
    <Modal
      isOpen={ui.isPayModalOpen}
      onClose={ui.closePayModal}
      title="Törlesztés rögzítése"
      description={ui.payDebt ? `${ui.payDebt.name} · ${formatHUF(remaining)} van hátra` : ''}
    >
      <DebtsPayForm
        payDebt={ui.payDebt}
        payAmount={ui.payAmount}
        onPayAmountChange={ui.setPayAmount}
        payDate={ui.payDate}
        onPayDateChange={ui.setPayDate}
        payNote={ui.payNote}
        onPayNoteChange={ui.setPayNote}
        payAddToBudget={ui.payAddToBudget}
        onPayAddToBudgetChange={ui.setPayAddToBudget}
        payCategory={ui.payCategory}
        onPayCategoryChange={ui.setPayCategory}
        paySaving={ui.paySaving}
        categories={categories}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSubmit={onSubmit}
        onCancel={ui.closePayModal}
      />
    </Modal>
  );
}
