'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  User,
  Home,
  FolderTree,
  Shield,
  Trash2,
  Plus,
  Key,
  Save,
  ShoppingBag,
  Wallet,
  Droplets,
  Gauge,
  ShieldAlert,
  UserPlus,
  Lock,
  TrendingDown,
  AlertTriangle,
  PiggyBank,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react';
import { BusinessOptionsEditor } from '@/components/modules/settings/BusinessOptionsEditor';
import { DebtsSettingsEditor } from '@/components/modules/settings/DebtsSettingsEditor';
import { MetersSettingsEditor } from '@/components/modules/settings/MetersSettingsEditor';
import { SavingsSettingsEditor } from '@/components/modules/settings/SavingsSettingsEditor';
import { UtilityTemplatesEditor } from '@/components/modules/settings/UtilityTemplatesEditor';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/lib/utilityTemplates';
import {
  resolveBusinessSettings,
  type BusinessSettings,
} from '@/lib/businessSettings';
import { resolveDebtsSettings, type DebtsSettings } from '@/lib/debtsSettings';
import { resolveMetersSettings, type MetersSettings } from '@/lib/metersSettings';
import { resolveSavingsSettings, type SavingsSettings } from '@/lib/savingsSettings';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { HELP } from '@/lib/helpTexts';
import { formatDisplayInitials, formatDisplayName } from '@/lib/personName';
import { type ModuleId } from '@/lib/moduleAccess';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader, InsightBanner, StatusPill } from '@/components/design';
import {
  SettingsTopTabs,
  SettingsSectionHeading,
  SettingsBlock,
  ModuleFeatureCard,
  SettingsDivider,
  PermissionChip,
  MemberCard,
  DangerZonePanel,
  CategoryTag,
} from '@/components/modules/settings/settings-ui';

type TabId = 'profile' | 'household' | 'modules';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const { categories, addCategory, deleteCategory } = useBudgetStore();
  const {
    user,
    updateUser,
    updateMember,
    patchMemberLocally,
    removeMember,
    addMember,
    updateHouseholdSettings,
    deleteHousehold,
  } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [localProfile, setLocalProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [householdName, setHouseholdName] = useState(user?.household?.name || '');
  const [budgetEnabled, setBudgetEnabled] = useState(user?.household?.budgetEnabled ?? user?.household?.budget_enabled ?? false);
  const [savingsEnabled, setSavingsEnabled] = useState(user?.household?.savingsEnabled ?? user?.household?.savings_enabled ?? false);
  const [debtsEnabled, setDebtsEnabled] = useState(user?.household?.debtsEnabled ?? user?.household?.debts_enabled ?? false);
  const [utilitiesEnabled, setUtilitiesEnabled] = useState(user?.household?.utilitiesEnabled ?? user?.household?.utilities_enabled ?? false);
  const [metersEnabled, setMetersEnabled] = useState(user?.household?.metersEnabled ?? user?.household?.meters_enabled ?? false);
  const [businessEnabled, setBusinessEnabled] = useState(user?.household?.businessEnabled ?? user?.household?.business_enabled ?? false);
  const [businessName, setBusinessName] = useState(user?.household?.businessName ?? user?.household?.business_name ?? '');
  const [shopifyImportEnabled, setShopifyImportEnabled] = useState(
    user?.household?.shopifyImportEnabled ?? user?.household?.shopify_import_enabled ?? false,
  );
  const [shopifyShopUrl, setShopifyShopUrl] = useState(user?.household?.shopifyShopUrl ?? user?.household?.shopify_shop_url ?? '');
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');
  const hasShopifyToken = user?.household?.hasShopifyToken ?? user?.household?.has_shopify_token ?? false;
  const [utilitySplitEnabled, setUtilitySplitEnabled] = useState(user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false);
  const [utilitySplitPartnerId, setUtilitySplitPartnerId] = useState<number | null>(
    user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id ?? null,
  );
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() =>
    resolveBusinessSettings(user?.household),
  );
  const [utilityTemplates, setUtilityTemplates] = useState<UtilityTemplate[]>(() =>
    resolveUtilityTemplates(user?.household),
  );
  const [savingsSettings, setSavingsSettings] = useState<SavingsSettings>(() => resolveSavingsSettings(user?.household));
  const [debtsSettings, setDebtsSettings] = useState<DebtsSettings>(() => resolveDebtsSettings(user?.household));
  const [metersSettings, setMetersSettings] = useState<MetersSettings>(() => resolveMetersSettings(user?.household));
  const [isNameSaving, setIsNameSaving] = useState(false);
  const [isBudgetSaving, setIsBudgetSaving] = useState(false);
  const [isSavingsSaving, setIsSavingsSaving] = useState(false);
  const [isDebtsSaving, setIsDebtsSaving] = useState(false);
  const [isUtilitiesSaving, setIsUtilitiesSaving] = useState(false);
  const [isMetersSaving, setIsMetersSaving] = useState(false);
  const [isBusinessSaving, setIsBusinessSaving] = useState(false);

  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    role: 'editor' as 'admin' | 'editor' | 'reader',
    permissions: ['budget', 'utilities'],
  });

  const [newCat, setNewCat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [isDeletingHousehold, setIsDeletingHousehold] = useState(false);

  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const MODULES = [
    { id: 'budget' as ModuleId, label: 'Költségvetés', icon: Wallet, description: '/budget — bevételek, kiadások' },
    { id: 'savings' as ModuleId, label: 'Megtakarítások', icon: PiggyBank, description: '/savings — Széf, állampapírok' },
    { id: 'debts' as ModuleId, label: 'Tartozások', icon: TrendingDown, description: '/debts — hitelek, kölcsönök' },
    { id: 'utilities' as ModuleId, label: 'Rezsi', icon: Droplets, description: '/utilities — közüzemi számlák' },
    { id: 'meters' as ModuleId, label: 'Közműórák', icon: Gauge, description: '/meters — fogyasztás' },
    { id: 'business' as ModuleId, label: businessEnabled ? businessName : 'Vállalkozás', icon: ShoppingBag, description: '/business — webshop' },
  ];

  const moduleEnabledState: Record<ModuleId, boolean> = {
    budget: budgetEnabled,
    savings: savingsEnabled,
    debts: debtsEnabled,
    utilities: utilitiesEnabled,
    meters: metersEnabled,
    business: businessEnabled,
  };

  const activeMemberModules = MODULES.filter((mod) => moduleEnabledState[mod.id]);

  useEffect(() => {
    setLocalProfile({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
    if (user?.household) {
      setHouseholdName(user.household.name || '');
      setBudgetEnabled(user.household.budgetEnabled ?? user.household.budget_enabled ?? false);
      setSavingsEnabled(user.household.savingsEnabled ?? user.household.savings_enabled ?? false);
      setDebtsEnabled(user.household.debtsEnabled ?? user.household.debts_enabled ?? false);
      setUtilitiesEnabled(user.household.utilitiesEnabled ?? user.household.utilities_enabled ?? false);
      setMetersEnabled(user.household.metersEnabled ?? user.household.meters_enabled ?? false);
      setBusinessEnabled(user.household.businessEnabled ?? user.household.business_enabled ?? false);
      setBusinessName(user.household.businessName ?? user.household.business_name ?? '');
      setShopifyImportEnabled(
        user.household.shopifyImportEnabled ?? user.household.shopify_import_enabled ?? false,
      );
      setShopifyShopUrl(user.household.shopifyShopUrl ?? user.household.shopify_shop_url ?? '');
      setShopifyAccessToken('');
      setUtilitySplitEnabled(user.household.utilitySplitEnabled ?? user.household.utility_split_enabled ?? false);
      setUtilitySplitPartnerId(user.household.utilitySplitPartnerId ?? user.household.utility_split_partner_id ?? null);
      setBusinessSettings(resolveBusinessSettings(user.household));
      setUtilityTemplates(resolveUtilityTemplates(user.household));
      setSavingsSettings(resolveSavingsSettings(user.household));
      setDebtsSettings(resolveDebtsSettings(user.household));
      setMetersSettings(resolveMetersSettings(user.household));
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const householdDisplayName = user?.household?.name || '';
  const deleteNameMatches = deleteConfirmName.trim() === householdDisplayName.trim();
  const canConfirmDelete = deleteNameMatches && deleteAcknowledged && !isDeletingHousehold;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser(localProfile);
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
      await updateUser({ password: newPassword, password_confirmation: confirmPassword } as unknown as Parameters<typeof updateUser>[0]);
      setNewPassword('');
      setConfirmPassword('');
      addNotification('Jelszó sikeresen megváltoztatva!', 'success');
    } catch {
      addNotification('Nem sikerült megváltoztatni a jelszót.', 'error');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const utilityPartners = user?.household?.users?.filter((u) => u.id !== user.id) || [];

  const handleHouseholdNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameSaving(true);
    try {
      await updateHouseholdSettings({ name: householdName });
      addNotification('Háztartás neve mentve.', 'success');
    } catch {
      addNotification('A név mentése nem sikerült.', 'error');
    } finally {
      setIsNameSaving(false);
    }
  };

  const handleModuleSave = async (
    key: `${ModuleId}_enabled`,
    enabled: boolean,
    setSaving: (v: boolean) => void,
    label: string,
  ) => {
    setSaving(true);
    try {
      await updateHouseholdSettings({ [key]: enabled });
      addNotification(`${label} modul mentve.`, 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessSave = async () => {
    if (businessEnabled) {
      if (!businessName.trim()) {
        addNotification('A vállalkozás nevét kötelező megadni, ha a modul be van kapcsolva!', 'error');
        return;
      }
      if (shopifyImportEnabled) {
        if (!shopifyShopUrl.trim()) {
          addNotification('A Shopify bolt URL-jét kötelező megadni, ha az import be van kapcsolva!', 'error');
          return;
        }
        if (!hasShopifyToken && !shopifyAccessToken.trim()) {
          addNotification('Az Admin API tokent kötelező megadni az első mentésnél!', 'error');
          return;
        }
        if (shopifyAccessToken.trim() && !/^shpat_|^shpua_/i.test(shopifyAccessToken.trim())) {
          addNotification('A Shopify token shpat_ vagy shpua_ előtaggal kell kezdődjön.', 'error');
          return;
        }
      }
    }
    setIsBusinessSaving(true);
    try {
      const payload: Parameters<typeof updateHouseholdSettings>[0] = {
        business_enabled: businessEnabled,
        business_name: businessName,
        shopify_import_enabled: businessEnabled ? shopifyImportEnabled : false,
        business_settings: businessSettings,
      };
      if (businessEnabled && shopifyImportEnabled) {
        payload.shopify_shop_url = shopifyShopUrl;
      }
      if (shopifyAccessToken.trim()) {
        payload.shopify_access_token = shopifyAccessToken.trim();
      }
      await updateHouseholdSettings(payload);
      setShopifyAccessToken('');
      addNotification('Vállalkozás modul mentve.', 'success');
    } catch {
      addNotification('A vállalkozás mentése nem sikerült.', 'error');
    } finally {
      setIsBusinessSaving(false);
    }
  };

  const handleSavingsSave = async () => {
    setIsSavingsSaving(true);
    try {
      await updateHouseholdSettings({
        savings_enabled: savingsEnabled,
        savings_settings: savingsSettings,
      });
      addNotification('Megtakarítás modul mentve.', 'success');
    } catch {
      addNotification('A megtakarítás mentése nem sikerült.', 'error');
    } finally {
      setIsSavingsSaving(false);
    }
  };

  const handleDebtsSave = async () => {
    setIsDebtsSaving(true);
    try {
      await updateHouseholdSettings({
        debts_enabled: debtsEnabled,
        debts_settings: debtsSettings,
      });
      addNotification('Tartozások modul mentve.', 'success');
    } catch {
      addNotification('A tartozások mentése nem sikerült.', 'error');
    } finally {
      setIsDebtsSaving(false);
    }
  };

  const handleMetersSave = async () => {
    setIsMetersSaving(true);
    try {
      await updateHouseholdSettings({
        meters_enabled: metersEnabled,
        meters_settings: metersSettings,
      });
      addNotification('Közműórák modul mentve.', 'success');
    } catch {
      addNotification('A közműórák mentése nem sikerült.', 'error');
    } finally {
      setIsMetersSaving(false);
    }
  };

  const handleUtilitiesSave = async () => {
    if (utilitiesEnabled && utilitySplitEnabled && utilityPartners.length > 0 && !utilitySplitPartnerId) {
      addNotification('Válassz elszámolási partnert a rezsi megosztáshoz!', 'error');
      return;
    }
    setIsUtilitiesSaving(true);
    try {
      await updateHouseholdSettings({
        utilities_enabled: utilitiesEnabled,
        utility_split_enabled: utilitiesEnabled ? utilitySplitEnabled : false,
        utility_split_partner_id: utilitiesEnabled && utilitySplitEnabled ? utilitySplitPartnerId : null,
        utility_templates: utilityTemplates.filter((t) => t.type.trim()),
      });
      setUtilityTemplates(resolveUtilityTemplates(useAuthStore.getState().user?.household));
      addNotification('Rezsi modul mentve.', 'success');
    } catch {
      addNotification('A rezsi modul mentése nem sikerült.', 'error');
    } finally {
      setIsUtilitiesSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.username || !newMemberData.password || !newMemberData.firstName) {
      addNotification('Kérlek tölts ki minden kötelező mezőt!', 'error');
      return;
    }
    await addMember({
      first_name: newMemberData.firstName,
      last_name: newMemberData.lastName,
      username: newMemberData.username.trim().toLowerCase(),
      password: newMemberData.password,
      role: newMemberData.role,
      permissions: newMemberData.permissions,
    });
    setNewMemberData({ firstName: '', lastName: '', username: '', password: '', role: 'editor', permissions: ['budget', 'utilities'] });
  };

  const handleDeleteHousehold = async () => {
    if (!canConfirmDelete) return;
    setIsDeletingHousehold(true);
    try {
      await deleteHousehold(deleteConfirmName.trim());
    } catch {
      addNotification('A törlés nem sikerült. Ellenőrizd a háztartás nevét.', 'error');
      setIsDeletingHousehold(false);
    }
  };

  const toggleMemberPermission = (memberId: number, moduleId: string) => {
    const member = user?.household?.users?.find((u) => u.id === memberId);
    if (!member) return;
    const currentPermissions = member.permissions || [];
    const newPermissions = currentPermissions.includes(moduleId)
      ? currentPermissions.filter((p) => p !== moduleId)
      : [...currentPermissions, moduleId];
    patchMemberLocally(memberId, { permissions: newPermissions });
    void updateMember(memberId, { permissions: newPermissions });
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profilom', icon: User, hint: 'Személyes adatok, jelszó, fiók törlése' },
    { id: 'household', label: 'Háztartás', icon: Home, hint: 'Név, családtagok, jogosultságok' },
    { id: 'modules', label: 'Modulok', icon: LayoutGrid, hint: 'Bekapcsolható funkciók és beállításaik' },
  ];

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Rendszer' }, { label: 'Beállítások' }]}
        title="Beállítások"
        description="Profil, háztartás és modulok — minden egy helyen."
      />

      <SettingsTopTabs tabs={settingsTabs} active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-8 w-full"
        >
          {activeTab === 'profile' && (
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
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteConfirmName('');
                      setDeleteAcknowledged(false);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 size={13} /> Háztartás végleges törlése…
                  </Button>
                </DangerZonePanel>
              )}
            </>
          )}

          {activeTab === 'household' && (
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
                                className="h-8 rounded-lg border border-border bg-input px-2.5 text-xs font-medium appearance-none focus:border-ring outline-none"
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
          )}

          {activeTab === 'modules' && (
            <>
              <SettingsSectionHeading
                title="Modulok"
                description="Kapcsold be, amit használsz. Ki kapcsolva a modul rejtve marad a menüben, az oldal nem elérhető, a vezérlőpult sem mutat hozzá kapcsolódó adatot."
              />

              {!isAdmin && (
                <InsightBanner tone="info" icon={ShieldAlert} title="Csak megtekintés">
                  A modulokat csak az adminisztrátor kapcsolhatja ki vagy be, és szerkesztheti a beállításaikat.
                </InsightBanner>
              )}

              {isAdmin && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                  <ModuleFeatureCard
                    title="Költségvetés"
                    description="Havi bevételek, kiadások és kategóriák — a pénzügyi alapmodul."
                    enabled={budgetEnabled}
                    onToggle={() => setBudgetEnabled((v) => !v)}
                    icon={<Wallet size={22} strokeWidth={2} />}
                    iconClassName="bg-emerald-500/12 text-emerald-600 border border-emerald-500/20"
                    footer={
                      <Button type="button" onClick={() => void handleModuleSave('budget_enabled', budgetEnabled, setIsBudgetSaving, 'Költségvetés')} loading={isBudgetSaving} disabled={isBudgetSaving}>
                        <Save size={13} />
                        {isBudgetSaving ? 'Mentés…' : 'Költségvetés mentése'}
                      </Button>
                    }
                  >
                    <SettingsDivider />
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-sm font-semibold text-foreground">Kategóriák</h5>
                      <StatusPill status="neutral" size="xs">
                        {categories.length} db
                      </StatusPill>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A költségvetésben használt címkék — strukturálják a kiadásokat és bevételeket.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newCat.trim()) {
                          addCategory(newCat.trim());
                          setNewCat('');
                        }
                      }}
                      className="flex flex-col gap-2 sm:flex-row sm:items-end rounded-xl border border-dashed border-border bg-muted/20 p-4"
                    >
                      <div className="flex-1">
                        <FormField label="Új kategória" info={HELP.settings.categoryName}>
                          <Input
                            value={newCat}
                            onChange={(e) => setNewCat(e.target.value)}
                            placeholder="pl. Élelmiszer, Rezsi, Autó…"
                            className="w-full bg-card"
                          />
                        </FormField>
                      </div>
                      <Button type="submit" className="shrink-0 sm:mb-0.5" disabled={!newCat.trim()}>
                        <Plus size={13} /> Hozzáadás
                      </Button>
                    </form>
                    {categories.length === 0 ? (
                      <InsightBanner tone="info" icon={FolderTree} title="Még nincs kategória">
                        Adj hozzá kategóriákat a költségvetésed strukturálásához — pl. Élelmiszer, Rezsi, Szórakozás.
                      </InsightBanner>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <CategoryTag
                            key={cat}
                            name={cat}
                            onDelete={() =>
                              requestDelete({
                                title: 'Kategória törlése',
                                message: `Biztosan törlöd a „${cat}" kategóriát? A meglévő tételek nem törlődnek.`,
                                onConfirm: () => deleteCategory(cat),
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </ModuleFeatureCard>

                  <ModuleFeatureCard
                    title="Megtakarítás"
                    description="Széf, bankszámlák és befektetések külön modulban."
                    enabled={savingsEnabled}
                    onToggle={() => setSavingsEnabled((v) => !v)}
                    icon={<PiggyBank size={22} strokeWidth={2} />}
                    iconClassName="bg-violet-500/12 text-violet-600 border border-violet-500/20"
                    footer={
                      <Button type="button" onClick={() => void handleSavingsSave()} loading={isSavingsSaving} disabled={isSavingsSaving}>
                        <Save size={13} />
                        {isSavingsSaving ? 'Mentés…' : 'Megtakarítás mentése'}
                      </Button>
                    }
                  >
                    <SavingsSettingsEditor value={savingsSettings} onChange={setSavingsSettings} />
                  </ModuleFeatureCard>

                  <ModuleFeatureCard
                    title="Tartozások"
                    description="Hitelek, kölcsönök és visszafizetési tervek."
                    enabled={debtsEnabled}
                    onToggle={() => setDebtsEnabled((v) => !v)}
                    icon={<TrendingDown size={22} strokeWidth={2} />}
                    iconClassName="bg-rose-500/12 text-rose-600 border border-rose-500/20"
                    footer={
                      <Button type="button" onClick={() => void handleDebtsSave()} loading={isDebtsSaving} disabled={isDebtsSaving}>
                        <Save size={13} />
                        {isDebtsSaving ? 'Mentés…' : 'Tartozások mentése'}
                      </Button>
                    }
                  >
                    <DebtsSettingsEditor value={debtsSettings} onChange={setDebtsSettings} />
                  </ModuleFeatureCard>

                  <ModuleFeatureCard
                    title="Rezsi"
                    description="Közüzemi számlák, megosztás és havi sablon tételek."
                    enabled={utilitiesEnabled}
                    onToggle={() => setUtilitiesEnabled((v) => !v)}
                    icon={<Droplets size={22} strokeWidth={2} />}
                    iconClassName="bg-sky-500/12 text-sky-600 border border-sky-500/20"
                    footer={
                      <Button type="button" onClick={() => void handleUtilitiesSave()} loading={isUtilitiesSaving} disabled={isUtilitiesSaving}>
                        <Save size={13} />
                        {isUtilitiesSaving ? 'Mentés…' : 'Rezsi mentése'}
                      </Button>
                    }
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Rezsi megosztás</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Közös számlák elszámolása partnerekkel.</p>
                        </div>
                        <Switch checked={utilitySplitEnabled} onCheckedChange={setUtilitySplitEnabled} aria-label="Rezsi megosztás" />
                      </div>
                      {utilitySplitEnabled && (
                        <FormField label="Elszámolási partner" info={HELP.settings.splitPartner}>
                          {utilityPartners.length === 0 ? (
                            <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5">
                              Nincs más tag. Először hozz létre egy családtagot a Háztartás fülön.
                            </p>
                          ) : (
                            <select
                              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                              value={utilitySplitPartnerId || ''}
                              onChange={(e) => setUtilitySplitPartnerId(e.target.value ? Number(e.target.value) : null)}
                            >
                              <option value="">Válassz partnert…</option>
                              {utilityPartners.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {formatDisplayName(p.firstName, p.lastName)}
                                </option>
                              ))}
                            </select>
                          )}
                        </FormField>
                      )}
                    </div>

                    <SettingsDivider />

                    <div>
                      <h5 className="text-sm font-semibold text-foreground">Rezsi sablon tételek</h5>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Rendszeres rezsi sorok — a Rezsi oldalon egy kattintással betölthetők.
                      </p>
                    </div>
                    <UtilityTemplatesEditor
                      value={utilityTemplates}
                      onChange={setUtilityTemplates}
                      isAdmin={isAdmin}
                    />
                  </ModuleFeatureCard>

                  <ModuleFeatureCard
                    title="Közműórák"
                    description="Villany, gáz, víz fogyasztás és mérőállások."
                    enabled={metersEnabled}
                    onToggle={() => setMetersEnabled((v) => !v)}
                    icon={<Gauge size={22} strokeWidth={2} />}
                    iconClassName="bg-amber-500/12 text-amber-600 border border-amber-500/20"
                    footer={
                      <Button type="button" onClick={() => void handleMetersSave()} loading={isMetersSaving} disabled={isMetersSaving}>
                        <Save size={13} />
                        {isMetersSaving ? 'Mentés…' : 'Közműórák mentése'}
                      </Button>
                    }
                  >
                    <MetersSettingsEditor value={metersSettings} onChange={setMetersSettings} />
                  </ModuleFeatureCard>

                  <ModuleFeatureCard
                    title="Vállalkozás"
                    description="Rendelések nyilvántartása, csatornák és fizetési módok — Shopify import opcionálisan."
                    enabled={businessEnabled}
                    onToggle={() => setBusinessEnabled((v) => !v)}
                    icon={<TrendingUp size={22} strokeWidth={2} />}
                    iconClassName="bg-emerald-500/12 text-emerald-600 border border-emerald-500/20"
                    footer={
                      <Button type="button" onClick={() => void handleBusinessSave()} loading={isBusinessSaving} disabled={isBusinessSaving}>
                        <Save size={13} />
                        {isBusinessSaving ? 'Mentés…' : 'Vállalkozás mentése'}
                      </Button>
                    }
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Megjelenő név" info={HELP.settings.businessName}>
                        <Input
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Pl. vállalkozás vagy webshop neve"
                        />
                      </FormField>
                    </div>

                    <SettingsDivider />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h5 className="text-sm font-semibold text-foreground">Shopify import</h5>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Ha Shopify webshopod van, automatikusan importálhatod a rendeléseket. Kikapcsolva manuálisan rögzítheted őket.
                          </p>
                        </div>
                        <Switch
                          checked={shopifyImportEnabled}
                          onCheckedChange={setShopifyImportEnabled}
                          disabled={!businessEnabled}
                          aria-label="Shopify import"
                        />
                      </div>

                      {shopifyImportEnabled && (
                        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4">
                          <FormField label="Shopify bolt URL" info={HELP.settings.shopifyUrl}>
                            <Input
                              value={shopifyShopUrl}
                              onChange={(e) => setShopifyShopUrl(e.target.value)}
                              placeholder="bolt-neve.myshopify.com"
                            />
                          </FormField>
                          <FormField
                            label="Admin API token"
                            info={HELP.settings.shopifyToken}
                            hint={
                              hasShopifyToken
                                ? 'Mentett token van — hagyd üresen, ha nem cseréled. Új token: shpat_ előtaggal.'
                                : 'Kötelező az első mentésnél. A token shpat_ karakterekkel kezdődik.'
                            }
                          >
                            <div className="relative">
                              <Lock
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                              />
                              <Input
                                type="password"
                                className="pl-8 font-mono text-sm"
                                value={shopifyAccessToken}
                                onChange={(e) => setShopifyAccessToken(e.target.value)}
                                placeholder={
                                  hasShopifyToken
                                    ? 'Üresen hagyva: megtartjuk a mentett tokent'
                                    : 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                                }
                                autoComplete="new-password"
                                spellCheck={false}
                              />
                            </div>
                          </FormField>
                        </div>
                      )}
                    </div>

                    <SettingsDivider />

                    <div>
                      <h5 className="text-sm font-semibold text-foreground">Vállalkozás mezői</h5>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Csatornák, fizetési módok és szolgáltatók — ezek jelennek meg rendelés rögzítésénél.
                      </p>
                    </div>
                    <BusinessOptionsEditor value={businessSettings} onChange={setBusinessSettings} />
                  </ModuleFeatureCard>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

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

      <ConfirmDeleteModal />
    </div>
  );
}
