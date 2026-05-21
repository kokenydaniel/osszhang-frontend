'use client';

import { Key, Save, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/lib/helpTexts';
import { DangerZonePanel, SettingsBlock, SettingsSectionHeading } from '@/components/modules/settings/settings-ui';
import type { SettingsState } from '@/components/modules/settings/hooks/use-settings-state';

type SettingsProfileTabProps = Pick<
  SettingsState,
  | 'user'
  | 'isAdmin'
  | 'localProfile'
  | 'setLocalProfile'
  | 'isSaving'
  | 'handleProfileSave'
  | 'newPassword'
  | 'setNewPassword'
  | 'confirmPassword'
  | 'setConfirmPassword'
  | 'isPasswordSaving'
  | 'handlePasswordSave'
  | 'openDeleteModal'
>;

export function SettingsProfileTab({
  user,
  isAdmin,
  localProfile,
  setLocalProfile,
  isSaving,
  handleProfileSave,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isPasswordSaving,
  handlePasswordSave,
  openDeleteModal,
}: SettingsProfileTabProps) {
  return (
    <>
      <SettingsSectionHeading
        title="Profilom"
        description="Személyes adataid és biztonsági beállítások. A háztartás törlése csak adminnak érhető el lent."
      />

      <SettingsBlock
        title="Személyes adatok"
        description="A neved és e-mail címed megjelenik a többi családtag felé."
        icon={User}
        toneClassName="bg-primary/10 text-primary"
        footer={
          <Button type="submit" form="profile-form" disabled={isSaving}>
            <Save size={13} />
            {isSaving ? 'Feldolgozás…' : 'Mentés'}
          </Button>
        }
      >
        <form id="profile-form" onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Vezetéknév" info={HELP.settings.lastName}>
              <Input
                value={localProfile.lastName}
                onChange={(e) => setLocalProfile({ ...localProfile, lastName: e.target.value })}
              />
            </FormField>
            <FormField label="Keresztnév" info={HELP.settings.firstName}>
              <Input
                value={localProfile.firstName}
                onChange={(e) => setLocalProfile({ ...localProfile, firstName: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Felhasználónév" info={HELP.settings.username}>
            <Input value={user?.username || ''} readOnly className="bg-muted/40" />
          </FormField>
        </form>
      </SettingsBlock>

      <SettingsBlock
        title="Biztonság"
        description="Frissítsd a jelszavadat. Minimum 8 karakter."
        icon={Key}
        toneClassName="bg-amber-500/10 text-amber-600"
        footer={
          <Button type="submit" form="password-form" disabled={isPasswordSaving}>
            <Key size={13} />
            {isPasswordSaving ? 'Feldolgozás…' : 'Jelszó frissítése'}
          </Button>
        }
      >
        <form id="password-form" onSubmit={handlePasswordSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Új jelszó" info={HELP.settings.password}>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Új jelszó megerősítése" info={HELP.settings.passwordConfirm}>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </FormField>
          </div>
        </form>
      </SettingsBlock>

      {isAdmin && (
        <DangerZonePanel
          title="Háztartás és fiókok törlése"
          description="Véglegesen törli a teljes háztartást, az összes pénzügyi adatot és minden családtag fiókját. A művelet nem vonható vissza."
        >
          <ul className="text-xs text-muted-foreground space-y-1.5 mb-4 list-disc pl-4">
            <li>Minden költségvetés, rezsi, tartozás, megtakarítás törlődik</li>
            <li>Minden családtag fiókja törlődik az adatbázisból</li>
            <li>Azonnal kijelentkeztet és a bejelentkezés oldalra irányít</li>
          </ul>
          <Button variant="destructive" onClick={openDeleteModal}>
            <Trash2 size={13} /> Háztartás végleges törlése…
          </Button>
        </DangerZonePanel>
      )}
    </>
  );
}
