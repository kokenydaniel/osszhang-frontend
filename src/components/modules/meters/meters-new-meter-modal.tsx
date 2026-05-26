'use client';

import { Modal } from '@/components/ui/Modal';
import { useMetersUi } from '@/components/modules/meters/MetersUiContext';
import { MetersNewMeterForm } from '@/components/modules/meters/meters-new-meter-form';
import type { MetersSettings } from '@/lib/metersSettings';

interface MetersNewMeterModalProps {
  metersSettings: MetersSettings;
  onSubmit: (event: React.FormEvent) => void;
  onApplyTemplate: (template: MetersSettings['templates'][number]) => void;
}

export function MetersNewMeterModal({ metersSettings, onSubmit, onApplyTemplate }: MetersNewMeterModalProps) {
  const ui = useMetersUi();

  return (
    <Modal
      isOpen={ui.isNewMeterModalOpen}
      onClose={ui.closeNewMeterModal}
      title="Új mérőóra hozzáadása"
    >
      <MetersNewMeterForm
        metersSettings={metersSettings}
        newMeterName={ui.newMeterName}
        onNewMeterNameChange={ui.setNewMeterName}
        newMeterUnit={ui.newMeterUnit}
        onNewMeterUnitChange={ui.setNewMeterUnit}
        newMeterLoc={ui.newMeterLoc}
        onNewMeterLocChange={ui.setNewMeterLoc}
        onApplyTemplate={onApplyTemplate}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
