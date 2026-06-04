'use client';

import { Home, Lock, Save, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/config/help';
import { formatDisplayInitials, formatDisplayName } from '@/utils/person-name';
import { InsightBanner, StatusPill } from '@/components/design';
import { SettingsBlock } from '@/components/settings/blocks/settings-block';
import { SettingsDivider } from '@/components/settings/blocks/settings-divider';
import { SettingsSectionHeading } from '@/components/settings/blocks/settings-section-heading';
import { MemberCard } from '@/components/settings/blocks/member-card';
import { PermissionChip } from '@/components/settings/chips/permission-chip';
import { useAuthStore } from '@/stores/useAuthStore';
import { householdClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import config, { type ModuleId } from '@/config/config';
import { isModuleEnabled } from '@/helpers/module-access';
import {
  Building2,
  Coins,
  Droplets,
  Gauge,
  HandCoins,
  MapPinned,
  PiggyBank,
  Shield,
  ShoppingBag,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const HOUSEHOLD_MODULE_UI: Record<
  ModuleId,
  { icon: LucideIcon; description: string }
> = {
  budget: { icon: Wallet, description: '/budget — bevételek, kiadások' },
  savings: { icon: PiggyBank, description: '/savings — Széf, állampapírok' },
  debts: { icon: TrendingDown, description: '/debts — hitelek, kölcsönök' },
  utilities: { icon: Droplets, description: '/utilities — közüzemi számlák' },
  meters: { icon: Gauge, description: '/meters — fogyasztás' },
  business: { icon: ShoppingBag, description: '/business — webshop' },
  pocket_money: { icon: Coins, description: '/pocket-money — gyerekek zsebpénze' },
  insurance: { icon: Shield, description: '/insurance — kötvények, díjak' },
  rental: { icon: Building2, description: '/rental — bérbeadás, bevételek' },
  receivables: { icon: HandCoins, description: '/receivables — kinek adtál, mi a hátralék' },
  travel_planner: { icon: MapPinned, description: '/tools/travel — AI utazástervező' },
};

export function SettingsHouseholdTab() {
  const { user, fetchMe } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const isAdmin = user?.role === 'admin';

  const [householdName, setHouseholdName] = useState('');
  const [isNameSaving, setIsNameSaving] = useState(false);
  
  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    role: 'editor' as 'admin' | 'editor' | 'reader',
    permissions: ['budget', 'utilities'],
  });
  const [pendingPermissionKeys, setPendingPermissionKeys] = useState<Set<string>>(new Set());
  const permissionUpdateQueuesRef = useRef<Map<number, Promise<void>>>(new Map());

  useEffect(() => {
    if (user?.household) {
      setHouseholdName(user.household.name || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user?.household?.id) return;
    if ((user.household.users?.length ?? 0) > 0) return;
    fetchMe();
  }, [user?.household?.id, user?.household?.users?.length, fetchMe]);

  const handleHouseholdNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameSaving(true);
    try {
      const res = await householdClient.update({ name: householdName });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error();
      await fetchMe();
      addNotification('Háztartás neve mentve.', 'success');
    } catch {
      addNotification('A név mentése nem sikerült.', 'error');
    } finally {
      setIsNameSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.username || !newMemberData.password || !newMemberData.firstName) {
      addNotification('Kérlek tölts ki minden kötelező mezőt!', 'error');
      return;
    }
    try {
      const res = await householdClient.createMember({
        first_name: newMemberData.firstName,
        last_name: newMemberData.lastName,
        username: newMemberData.username.trim().toLowerCase(),
        password: newMemberData.password,
        role: newMemberData.role,
        permissions: newMemberData.permissions,
      });
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) throw new Error();
      await fetchMe();
      addNotification('Új családtag sikeresen létrehozva!', 'success');
      setNewMemberData({ firstName: '', lastName: '', username: '', password: '', role: 'editor' as 'admin' | 'editor' | 'reader', permissions: ['budget', 'utilities'] });
    } catch {
      addNotification('Hiba történt a regisztráció során.', 'error');
    }
  };

  const permissionPendingKey = (memberId: number, moduleId: string) => `${memberId}:${moduleId}`;

  const toggleMemberPermission = (memberId: number, moduleId: string) => {
    const pendingKey = permissionPendingKey(memberId, moduleId);
    if (pendingPermissionKeys.has(pendingKey)) return;

    setPendingPermissionKeys((prev) => new Set(prev).add(pendingKey));

    const previousQueue = permissionUpdateQueuesRef.current.get(memberId) ?? Promise.resolve();
    let releaseQueue!: () => void;
    const queueTail = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });
    permissionUpdateQueuesRef.current.set(memberId, queueTail);

    const updatePerms = async () => {
      await previousQueue;
      try {
        const member = useAuthStore.getState().user?.household?.users?.find((u) => u.id === memberId);
        if (!member) return;

        const currentPermissions = member.permissions || [];
        const newPermissions = currentPermissions.includes(moduleId)
          ? currentPermissions.filter((p) => p !== moduleId)
          : [...currentPermissions, moduleId];

        const res = await householdClient.updateMember(memberId, { permissions: newPermissions });
        if (!res || res[0] !== StatusCodes.Http200) throw new Error();
        await fetchMe();
        addNotification('Jogosultság mentve.', 'success');
      } catch {
        await fetchMe();
        addNotification('A mentés nem sikerült.', 'error');
      } finally {
        setPendingPermissionKeys((prev) => {
          const next = new Set(prev);
          next.delete(pendingKey);
          return next;
        });
        releaseQueue();
        if (permissionUpdateQueuesRef.current.get(memberId) === queueTail) {
          permissionUpdateQueuesRef.current.delete(memberId);
        }
      }
    };
    void updatePerms();
  };

  const h = user?.household;
  const modules = config.modules.ids.map((id) => {
    const ui = HOUSEHOLD_MODULE_UI[id];
    const label =
      id === 'business'
        ? (h?.business_name || config.modules.labels.business)
        : config.modules.labels[id];

    return {
      id,
      label,
      icon: ui.icon,
      description: ui.description,
      enabled: isModuleEnabled(h, id),
    };
  });
  
  const activeMemberModules = modules.filter((m) => m.enabled);

  const activeAssignablePermissions = activeMemberModules;

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
            const initials = formatDisplayInitials(member.first_name, member.last_name);
            return (
              <MemberCard
                key={member.id}
                initials={initials}
                name={formatDisplayName(member.first_name, member.last_name)}
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
                          const updateRole = async () => {
                            try {
                              const res = await householdClient.updateMember(member.id, { role });
                              if (!res || res[0] !== StatusCodes.Http200) throw new Error();
                              await fetchMe();
                              addNotification('Szerepkör mentve.', 'success');
                            } catch {
                              await fetchMe();
                              addNotification('A mentés nem sikerült.', 'error');
                            }
                          };
                          void updateRole();
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
                            message: `Biztosan törlöd ${formatDisplayName(member.first_name, member.last_name)} fiókját? A művelet visszavonhatatlan.`,
                            confirmText: 'Törlés',
                            onConfirm: async () => {
                              try {
                                const res = await householdClient.deleteMember(member.id);
                                if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) throw new Error();
                                await fetchMe();
                                addNotification('Tag fiókja törölve.', 'success');
                              } catch {
                                addNotification('Hiba történt az eltávolítás során.', 'error');
                              }
                            },
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </Button>
                    </>
                  ) : undefined
                }
                permissions={activeAssignablePermissions.map((mod) => {
                  const hasAccess = isMemberAdmin || memberPermissions.includes(mod.id);
                  const Icon = mod.icon;
                  const disabled = !isAdmin || member.id === user?.id || isMemberAdmin;
                  const pending = pendingPermissionKeys.has(permissionPendingKey(member.id, mod.id));
                  return (
                    <PermissionChip
                      key={mod.id}
                      label={mod.label}
                      icon={Icon}
                      active={hasAccess}
                      disabled={disabled}
                      pending={pending}
                      onClick={disabled || pending ? undefined : () => toggleMemberPermission(member.id, mod.id)}
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
                    <option value="reader">Olvasó (csak megtekintés)</option>
                    <option value="editor">Szerkesztő (kezelheti a pénzügyeket)</option>
                    <option value="admin">Adminisztrátor (teljes hozzáférés)</option>
                  </select>
                </FormField>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <FieldLabel info={HELP.settings.invitePermissions}>Alapértelmezett modul jogosultságok</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {activeAssignablePermissions.map((mod) => {
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
      <ConfirmDeleteModal />
    </>
  );
}
