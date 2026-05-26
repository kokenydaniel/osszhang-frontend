'use client';

import { Modal } from '@/components/ui/Modal';
import { useMetersUi } from '@/components/modules/meters/MetersUiContext';
import { MetersReadingForm } from '@/components/modules/meters/meters-reading-form';
import type { Meter } from '@/types';

interface MetersReadingModalProps {
  meters: Meter[];
  onSubmit: (event: React.FormEvent) => void;
  saving?: boolean;
}

export function MetersReadingModal({ meters, onSubmit, saving }: MetersReadingModalProps) {
  const ui = useMetersUi();

  return (
    <Modal
      isOpen={ui.isReadingModalOpen}
      onClose={ui.closeReadingModal}
      title={ui.editingReading ? 'Leolvasás szerkesztése' : 'Mérőóra rögzítése'}
    >
      <MetersReadingForm
        editingReading={ui.editingReading}
        meters={meters}
        meterId={ui.meterId}
        onMeterIdChange={ui.setMeterId}
        date={ui.date}
        onDateChange={ui.setDate}
        value={ui.value}
        onValueChange={ui.setValue}
        isReset={ui.isReset}
        onIsResetChange={ui.setIsReset}
        isOfficial={ui.isOfficial}
        onIsOfficialChange={ui.setIsOfficial}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}
