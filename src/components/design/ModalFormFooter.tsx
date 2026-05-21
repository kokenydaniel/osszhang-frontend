'use client';

import { Button } from '@/components/ui/button';

interface ModalFormFooterProps {
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  loading?: boolean;
  submitType?: 'submit' | 'button';
  onSubmit?: () => void;
  submitIcon?: React.ReactNode;
}

export function ModalFormFooter({
  onCancel,
  submitLabel = 'Mentés',
  cancelLabel = 'Mégse',
  submitDisabled,
  loading,
  submitType = 'submit',
  onSubmit,
  submitIcon,
}: ModalFormFooterProps) {
  return (
    <div className="flex gap-2 pt-1">
      <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        type={submitType}
        className="flex-1"
        disabled={submitDisabled || loading}
        onClick={submitType === 'button' ? onSubmit : undefined}
      >
        {submitIcon}
        {loading ? 'Feldolgozás…' : submitLabel}
      </Button>
    </div>
  );
}
