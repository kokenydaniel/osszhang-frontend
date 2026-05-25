'use client';

import { Home, Lock, Save, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/lib/helpTexts';
import { formatDisplayInitials, formatDisplayName } from '@/lib/personName';
import { InsightBanner, StatusPill } from '@/components/design';
import {
  MemberCard,
  PermissionChip,
  SettingsBlock,
  SettingsDivider,
  SettingsSectionHeading,
} from '@/components/modules/settings/settings-ui';
import type { SettingsState } from '@/components/modules/settings/hooks/use-settings-state';

type SettingsHouseholdTabProps = Pick<
  SettingsState,
  | 'user'
  | 'isAdmin'
  | 'householdName'
  | 'setHouseholdName'
  | 'isNameSaving'
  | 'handleHouseholdNameSave'
  | 'activeMemberModules'
  | 'toggleMemberPermission'
  | 'patchMemberLocally'
  | 'updateMember'
  | 'removeMember'
  | 'requestDelete'
  | 'newMemberData'
  | 'setNewMemberData'
  | 'handleAddMember'
>;

export function SettingsHouseholdTab({
  user,
  isAdmin,
  householdName,
  setHouseholdName,
  isNameSaving,
  handleHouseholdNameSave,
  activeMemberModules,
  toggleMemberPermission,
  patchMemberLocally,
  updateMember,
  removeMember,
  requestDelete,
  newMemberData,
  setNewMemberData,
  handleAddMember,
}: SettingsHouseholdTabProps) {
  return (
    <>
      <SettingsSectionHeading
        title="Háztartás"
        description="Háztartás neve, családtagok és modul jogosultságok."
        badge={
          <StatusPill status="neutral" size="xs">
            {user?.household?.users?.length || 0} tag
          </StatusPill>
        }
      />

      {!isAdmin && (
        <InsightBanner tone="info" icon={ShieldAlert} title="Csak megtekintés">
          A háztartás beállításait csak az adminisztrátor módosíthatja. A tagok listáját lent láthatod.
        </InsightBanner>
      )}

      {isAdmin && (
        <div className="flex flex-col gap-8">
          <SettingsBlock
            title="Háztartás neve"
            description="Ez a megjelenő név az egész család számára."
            icon={Home}
            toneClassName="bg-primary/10 text-primary"
            footer={
              <Button type="submit" form="household-name-form" disabled={isNameSaving}>
                <Save size={13} />
                {isNameSaving ? 'Mentés…' : 'Név mentése'}
              </Button>
            }
          >
            <form id="household-name-form" onSubmit={handleHouseholdNameSave}>
              <FormField label="Megnevezés" info={HELP.settings.householdName}>
                <Input
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  required
                  placeholder="Pl. Kovács Család"
                />
              </FormField>
            </form>
          </SettingsBlock>
        </div>
      )}

      <SettingsDivider label="Család" />

      <div className="flex flex-col gap-5">
        <SettingsSectionHeading
          title="Családtagok"
          description={
            isAdmin
              ? 'Szerepkör és modul hozzáférés — kattints a modulokra a jogosultság váltásához.'
              : 'A háztartásban regisztrált felhasználók.'
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {user?.household?.users?.map((member) => {
            const memberPermissions = member.permissions || [];
            const isMemberAdmin = member.role === 'admin';
            const initials = formatDisplayInitials(member.firstName, member.lastName);
            return (
              <MemberCard
                key={member.id}
                initials={initials}
                name={formatDisplayName(member.firstName, member.lastName)}
                username={member.username}
                badges={
                  <>
                    {isMemberAdmin && (
                      <StatusPill status="primary" size="xs">
                        <ShieldAlert size={10} /> admin
                      </StatusPill>
                    )}
                    {member.id === user?.id && <StatusPill status="neutral" size="xs">Én</StatusPill>}
                  </>
                }
                actions={
                  isAdmin && member.id !== user?.id ? (
                    <>
                      <select
                        value={member.role || 'editor'}
                        onChange={(e) => {
                          const role = e.target.value as 'admin' | 'editor' | 'reader';
                          patchMemberLocally(member.id, { role });
                          void updateMember(member.id, { role });
                        }}
                        className="h-9 w-full max-w-full rounded-lg border border-border bg-input px-2.5 text-xs font-medium appearance-none focus:border-ring outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Szerkesztő</option>
                        <option value="reader">Olvasó</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          requestDelete({
                            title: 'Tag törlése',
                            message: `Biztosan törlöd ${formatDisplayName(member.firstName, member.lastName)} fiókját? A művelet visszavonhatatlan.`,
                            confirmText: 'Törlés',
                            onConfirm: () => removeMember(member.id),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </Button>
                    </>
                  ) : undefined
                }
                permissions={activeMemberModules.map((mod) => {
                  const hasAccess = isMemberAdmin || memberPermissions.includes(mod.id);
                  const Icon = mod.icon;
                  const disabled = !isAdmin || member.id === user?.id || isMemberAdmin;
                  return (
                    <PermissionChip
                      key={mod.id}
                      label={mod.label}
                      icon={Icon}
                      active={hasAccess}
                      disabled={disabled}
                      onClick={disabled ? undefined : () => toggleMemberPermission(member.id, mod.id)}
                      title={mod.description}
                    />
                  );
                })}
              />
            );
          })}
        </div>
      </div>

      {isAdmin && (
        <SettingsBlock
          title="Új családtag"
          description="Felhasználónév + ideiglenes jelszó — első belépéskor kötelező új jelszót választania."
          icon={UserPlus}
          toneClassName="bg-emerald-500/10 text-emerald-600"
          footer={
            <Button type="submit" form="new-member-form">
              <UserPlus size={13} /> Fiók létrehozása
            </Button>
          }
        >
          <form id="new-member-form" onSubmit={handleAddMember} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Vezetéknév" info={HELP.settings.lastName}>
                <Input
                  placeholder="Kovács"
                  value={newMemberData.lastName}
                  onChange={(e) => setNewMemberData({ ...newMemberData, lastName: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Keresztnév" info={HELP.settings.firstName}>
                <Input
                  placeholder="Ildi"
                  value={newMemberData.firstName}
                  onChange={(e) => setNewMemberData({ ...newMemberData, firstName: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Felhasználónév" info={HELP.settings.inviteUsername}>
                <Input
                  type="text"
                  placeholder="ildi"
                  value={newMemberData.username}
                  onChange={(e) =>
                    setNewMemberData({ ...newMemberData, username: e.target.value.toLowerCase() })
                  }
                  required
                  pattern="[a-z0-9_]{3,32}"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Ideiglenes jelszó" info={HELP.settings.invitePassword}>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    type="password"
                    className="pl-8"
                    placeholder="••••••••"
                    value={newMemberData.password}
                    onChange={(e) => setNewMemberData({ ...newMemberData, password: e.target.value })}
                    required
                  />
                </div>
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Szerepkör" info={HELP.settings.inviteRole}>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                    value={newMemberData.role}
                    onChange={(e) =>
                      setNewMemberData({ ...newMemberData, role: e.target.value as 'admin' | 'editor' | 'reader' })
                    }
                  >
                    <option value="editor">Szerkesztő (szerkeszthet, hozzáadhat)</option>
                    <option value="reader">Olvasó (csak megtekint)</option>
                    <option value="admin">Adminisztrátor (teljes hozzáférés)</option>
                  </select>
                </FormField>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <FieldLabel info={HELP.settings.invitePermissions}>Alapértelmezett modul jogosultságok</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {activeMemberModules.map((mod) => {
                  const Icon = mod.icon;
                  const active = newMemberData.permissions.includes(mod.id);
                  return (
                    <PermissionChip
                      key={mod.id}
                      label={mod.label}
                      icon={Icon}
                      active={active}
                      onClick={() => {
                        const current = newMemberData.permissions;
                        const updated = current.includes(mod.id)
                          ? current.filter((p) => p !== mod.id)
                          : [...current, mod.id];
                        setNewMemberData({ ...newMemberData, permissions: updated });
                      }}
                      title={mod.description}
                    />
                  );
                })}
              </div>
            </div>
          </form>
        </SettingsBlock>
      )}
    </>
  );
}
