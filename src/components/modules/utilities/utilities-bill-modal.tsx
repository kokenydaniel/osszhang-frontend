'use client';

import { Modal } from '@/components/ui/Modal';
import { HELP } from '@/lib/helpTexts';
import { useUtilitiesUi } from '@/components/modules/utilities/UtilitiesUiContext';
import { UtilitiesBillForm } from '@/components/modules/utilities/utilities-bill-form';
import type { UtilitySettlementOption } from '@/services/UtilitiesService';

interface UtilitiesBillModalProps {
  utilitySplitEnabled: boolean;
  settlementOptions: UtilitySettlementOption[];
  householdSideLabel: string;
  partnerSideLabel: string;
  onSubmit: (event: React.FormEvent) => void;
  saving?: boolean;
}

export function UtilitiesBillModal({
  utilitySplitEnabled,
  settlementOptions,
  householdSideLabel,
  partnerSideLabel,
  onSubmit,
  saving,
}: UtilitiesBillModalProps) {
  const ui = useUtilitiesUi();

  return (
    <Modal
      isOpen={ui.isBillModalOpen}
      onClose={ui.closeBillModal}
      title={ui.editingBill ? 'Rezsi szerkesztése' : 'Új rezsi rögzítése'}
      description={utilitySplitEnabled ? HELP.utilities.settlementIntro : undefined}
    >
      <UtilitiesBillForm
        editingBill={ui.editingBill}
        utilitySplitEnabled={utilitySplitEnabled}
        type={ui.type}
        onTypeChange={ui.setType}
        total={ui.total}
        onTotalChange={ui.setTotal}
        dueDate={ui.dueDate}
        onDueDateChange={ui.setDueDate}
        splitRule={ui.splitRule}
        onSplitRuleChange={ui.setSplitRule}
        settlementOptions={settlementOptions}
        householdSideLabel={householdSideLabel}
        partnerSideLabel={partnerSideLabel}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}
