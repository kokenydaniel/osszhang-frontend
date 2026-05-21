'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { HELP } from '@/lib/helpTexts';
import type { SettingsState } from '@/components/modules/settings/hooks/use-settings-state';

type SettingsDeleteHouseholdModalProps = Pick<
  SettingsState,
  | 'user'
  | 'isDeleteModalOpen'
  | 'setIsDeleteModalOpen'
  | 'deleteConfirmName'
  | 'setDeleteConfirmName'
  | 'deleteAcknowledged'
  | 'setDeleteAcknowledged'
  | 'isDeletingHousehold'
  | 'householdDisplayName'
  | 'canConfirmDelete'
  | 'handleDeleteHousehold'
>;

export function SettingsDeleteHouseholdModal({
  user,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  deleteConfirmName,
  setDeleteConfirmName,
  deleteAcknowledged,
  setDeleteAcknowledged,
  isDeletingHousehold,
  householdDisplayName,
  canConfirmDelete,
  handleDeleteHousehold,
}: SettingsDeleteHouseholdModalProps) {
  return (
    <Modal
      isOpen={isDeleteModalOpen}
      onClose={() => !isDeletingHousehold && setIsDeleteModalOpen(false)}
      title="Háztartás végleges törlése"
      description="Ez a művelet nem vonható vissza. Minden adat és fiók törlődik."
      size="md"
      contentKey={deleteAcknowledged ? 'ack' : 'open'}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            A <strong className="font-semibold">{householdDisplayName}</strong> háztartás és{' '}
            <strong className="font-semibold">{user?.household?.users?.length || 0} felhasználó</strong> összes adata
            véglegesen törlődik.
          </p>
        </div>

        <FormField
          label={
            <>
              Írd be a háztartás nevét: <span className="font-semibold text-foreground">{householdDisplayName}</span>
            </>
          }
          info={HELP.settings.deleteHousehold}
        >
          <Input
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={householdDisplayName}
            autoComplete="off"
          />
        </FormField>

        <label className="flex items-start gap-2.5 cursor-pointer text-sm text-foreground">
          <input
            type="checkbox"
            checked={deleteAcknowledged}
            onChange={(e) => setDeleteAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border"
          />
          <span>Megértem, hogy a törlés végleges és minden családtag fiókja eltűnik.</span>
        </label>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeletingHousehold}>
            Mégse
          </Button>
          <Button variant="destructive" disabled={!canConfirmDelete} onClick={handleDeleteHousehold}>
            {isDeletingHousehold ? 'Törlés…' : 'Végleges törlés'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
