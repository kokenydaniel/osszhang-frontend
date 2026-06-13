'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { formatDisplayName } from '@/utils/person-name';
import type { AdminHouseholdMember } from '@/types/admin';

type AdminResetPasswordModalProps = {
  target: AdminHouseholdMember | null;
  onClose: () => void;
  onConfirm: (password: string, passwordConfirmation: string) => Promise<boolean>;
  loading?: boolean;
};

export function AdminResetPasswordModal({
  target,
  onClose,
  onConfirm,
  loading = false,
}: AdminResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  if (!target) return null;

  const label = formatDisplayName(target.first_name, target.last_name) || target.username;
  const canSubmit = password.length >= 8 && password === passwordConfirmation && !loading;

  const handleClose = () => {
    if (loading) return;
    setPassword('');
    setPasswordConfirmation('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const ok = await onConfirm(password, passwordConfirmation);
    if (ok) {
      setPassword('');
      setPasswordConfirmation('');
    }
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title="Ideiglenes jelszó beállítása"
      description={`${label} (@${target.username}) — első belépéskor kötelező megváltoztatni.`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Add meg az új ideiglenes jelszót. A felhasználó ezzel tud bejelentkezni; belépés után a rendszer
          automatikusan kéri, hogy állítson be saját jelszót (ugyanaz a folyamat, mint új tag hozzáadásakor).
        </p>
        <FormField label="Ideiglenes jelszó">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
        </FormField>
        <FormField label="Jelszó megerősítése">
          <Input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
        </FormField>
      </div>
      <ModalFormFooter
        onCancel={handleClose}
        onSubmit={() => void handleSubmit()}
        submitLabel="Jelszó beállítása"
        submitType="button"
        loading={loading}
        submitDisabled={!canSubmit}
      />
    </Modal>
  );
}
