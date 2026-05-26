'use client';

import { Modal } from '@/components/ui/Modal';
import { Sparkles } from 'lucide-react';
import { useMetersUi } from '@/components/modules/meters/MetersUiContext';
import { MetersAiForm } from '@/components/modules/meters/meters-ai-form';

interface MetersAiModalProps {
  onSubmit: (event: React.FormEvent) => void;
  onFillAllGaps: () => void;
}

export function MetersAiModal({ onSubmit, onFillAllGaps }: MetersAiModalProps) {
  const ui = useMetersUi();

  return (
    <Modal
      isOpen={ui.isAiModalOpen}
      onClose={ui.closeAiModal}
      title="AI fogyasztás-becslés"
      icon={<Sparkles size={16} />}
    >
      <MetersAiForm
        aiYear={ui.aiYear}
        onAiYearChange={ui.setAiYear}
        aiMonth={ui.aiMonth}
        onAiMonthChange={ui.setAiMonth}
        isAiLoading={ui.isAiLoading}
        onSubmit={onSubmit}
        onFillAllGaps={onFillAllGaps}
      />
    </Modal>
  );
}
