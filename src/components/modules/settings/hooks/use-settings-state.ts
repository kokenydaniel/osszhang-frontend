'use client';

import { useEffect, useState } from 'react';
import {
  Droplets,
  Gauge,
  Home,
  LayoutGrid,
  PiggyBank,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/lib/utilityTemplates';
import { resolveBusinessSettings, type BusinessSettings } from '@/lib/businessSettings';
import { resolveDebtsSettings, type DebtsSettings } from '@/lib/debtsSettings';
import { resolveMetersSettings, type MetersSettings } from '@/lib/metersSettings';
import { resolveSavingsSettings, type SavingsSettings } from '@/lib/savingsSettings';
import { type ModuleId } from '@/lib/moduleAccess';

export type SettingsTabId = 'profile' | 'household' | 'modules';

export function useSettingsState() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');

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

  const modules = [
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

  const activeMemberModules = modules.filter((mod) => moduleEnabledState[mod.id]);

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

  const handleBudgetSave = () => handleModuleSave('budget_enabled', budgetEnabled, setIsBudgetSaving, 'Költségvetés');

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

  const openDeleteModal = () => {
    setDeleteConfirmName('');
    setDeleteAcknowledged(false);
    setIsDeleteModalOpen(true);
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
    { id: 'profile' as const, label: 'Profilom', icon: User, hint: 'Személyes adatok, jelszó, fiók törlése' },
    { id: 'household' as const, label: 'Háztartás', icon: Home, hint: 'Név, családtagok, jogosultságok' },
    { id: 'modules' as const, label: 'Modulok', icon: LayoutGrid, hint: 'Bekapcsolható funkciók és beállításaik' },
  ];

  return {
    activeTab,
    setActiveTab,
    settingsTabs,
    user,
    isAdmin,
    categories,
    addCategory,
    deleteCategory,
    localProfile,
    setLocalProfile,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isPasswordSaving,
    isSaving,
    handleProfileSave,
    handlePasswordSave,
    householdName,
    setHouseholdName,
    isNameSaving,
    handleHouseholdNameSave,
    newMemberData,
    setNewMemberData,
    handleAddMember,
    activeMemberModules,
    toggleMemberPermission,
    patchMemberLocally,
    updateMember,
    removeMember,
    requestDelete,
    budgetEnabled,
    setBudgetEnabled,
    savingsEnabled,
    setSavingsEnabled,
    debtsEnabled,
    setDebtsEnabled,
    utilitiesEnabled,
    setUtilitiesEnabled,
    metersEnabled,
    setMetersEnabled,
    businessEnabled,
    setBusinessEnabled,
    businessName,
    setBusinessName,
    shopifyImportEnabled,
    setShopifyImportEnabled,
    shopifyShopUrl,
    setShopifyShopUrl,
    shopifyAccessToken,
    setShopifyAccessToken,
    hasShopifyToken,
    utilitySplitEnabled,
    setUtilitySplitEnabled,
    utilitySplitPartnerId,
    setUtilitySplitPartnerId,
    utilityPartners,
    businessSettings,
    setBusinessSettings,
    utilityTemplates,
    setUtilityTemplates,
    savingsSettings,
    setSavingsSettings,
    debtsSettings,
    setDebtsSettings,
    metersSettings,
    setMetersSettings,
    isBudgetSaving,
    isSavingsSaving,
    isDebtsSaving,
    isUtilitiesSaving,
    isMetersSaving,
    isBusinessSaving,
    handleModuleSave,
    handleBudgetSave,
    handleBusinessSave,
    handleSavingsSave,
    handleDebtsSave,
    handleMetersSave,
    handleUtilitiesSave,
    newCat,
    setNewCat,
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
    openDeleteModal,
    ConfirmDeleteModal,
  };
}

export type SettingsState = ReturnType<typeof useSettingsState>;
