'use client';

import { Key, Save, Trash2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/config/help';
import { DangerZonePanel } from '@/components/settings/blocks/danger-zone-panel';
import { SettingsBlock } from '@/components/settings/blocks/settings-block';
import { SettingsSectionHeading } from '@/components/settings/blocks/settings-section-heading';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface SettingsProfileTabProps {
  openDeleteModal: () => void;
}

export function SettingsProfileTab({ openDeleteModal }: SettingsProfileTabProps) {
  const { user, updateUser } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const isAdmin = user?.role === 'admin';

  const [localProfile, setLocalProfile] = useState({ firstName: '', lastName: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setLocalProfile({ firstName: user.first_name || '', lastName: user.last_name || '' });
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        first_name: localProfile.firstName,
        last_name: localProfile.lastName,
      });
      addNotification('Profil sikeresen mentve!', 'success');
    } catch {
      addNotification('Sikertelen mentés.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addNotification('A jelszónak legalább 8 karakterből kell állnia!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addNotification('A két jelszó nem egyezik meg!', 'error');
      return;
    }
    setIsPasswordSaving(true);
    try {
      await updateUser({ password: newPassword, password_confirmation: confirmPassword } as any);
      setNewPassword('');
      setConfirmPassword('');
      addNotification('Jelszó sikeresen megváltoztatva!', 'success');
    } catch {
      addNotification('Nem sikerült megváltoztatni a jelszót.', 'error');
    } finally {
      setIsPasswordSaving(false);
    }
  };

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
