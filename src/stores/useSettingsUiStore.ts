import { create } from 'zustand';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/lib/utilityTemplates';
import { resolveBusinessSettings, type BusinessSettings } from '@/lib/businessSettings';
import { resolveDebtsSettings, type DebtsSettings } from '@/lib/debtsSettings';
import { resolveMetersSettings, type MetersSettings } from '@/lib/metersSettings';
import { resolveSavingsSettings, savingsSettingsForApi, type SavingsSettings } from '@/lib/savingsSettings';
import { type ModuleId } from '@/lib/moduleAccess';
import { featureEnableAllowed, moduleEnableAllowed } from '@/lib/moduleTierGate';
import { canUseFeature } from '@/lib/checkAccess';
import { useAuthStore } from './useAuthStore';
import { useBudgetStore } from './useBudgetStore';
import { useNotificationStore } from './useNotificationStore';
import type { UserProfile } from '@/types';

export type SettingsTabId = 'profile' | 'household' | 'modules' | 'billing';

interface SettingsUiState {
  activeTab: SettingsTabId;
  localProfile: { firstName: string; lastName: string };
  newPassword: string;
  confirmPassword: string;
  isPasswordSaving: boolean;
  householdName: string;
  budgetEnabled: boolean;
  savingsEnabled: boolean;
  debtsEnabled: boolean;
  utilitiesEnabled: boolean;
  metersEnabled: boolean;
  businessEnabled: boolean;
  businessName: string;
  shopifyImportEnabled: boolean;
  shopifyShopUrl: string;
  shopifyAccessToken: string;
  utilitySplitEnabled: boolean;
  utilitySplitPartnerId: number | null;
  businessSettings: BusinessSettings;
  utilityTemplates: UtilityTemplate[];
  savingsSettings: SavingsSettings;
  debtsSettings: DebtsSettings;
  metersSettings: MetersSettings;
  isNameSaving: boolean;
  isBudgetSaving: boolean;
  isSavingsSaving: boolean;
  isDebtsSaving: boolean;
  isUtilitiesSaving: boolean;
  isMetersSaving: boolean;
  isBusinessSaving: boolean;
  newMemberData: {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    role: 'admin' | 'editor' | 'reader';
    permissions: string[];
  };
  newCat: string;
  isSaving: boolean;
  isDeleteModalOpen: boolean;
  deleteConfirmName: string;
  deleteAcknowledged: boolean;
  isDeletingHousehold: boolean;

  setActiveTab: (tab: SettingsTabId) => void;
  setLocalProfile: (profile: { firstName: string; lastName: string }) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setHouseholdName: (value: string) => void;
  setBudgetEnabled: (value: boolean) => void;
  setSavingsEnabled: (value: boolean) => void;
  setDebtsEnabled: (value: boolean) => void;
  setUtilitiesEnabled: (value: boolean) => void;
  setMetersEnabled: (value: boolean) => void;
  setBusinessEnabled: (value: boolean) => void;
  setBusinessName: (value: string) => void;
  setShopifyImportEnabled: (value: boolean) => void;
  setShopifyShopUrl: (value: string) => void;
  setShopifyAccessToken: (value: string) => void;
  setUtilitySplitEnabled: (value: boolean) => void;
  setUtilitySplitPartnerId: (value: number | null) => void;
  setBusinessSettings: (value: BusinessSettings) => void;
  setUtilityTemplates: (value: UtilityTemplate[]) => void;
  setSavingsSettings: (value: SavingsSettings) => void;
  setDebtsSettings: (value: DebtsSettings) => void;
  setMetersSettings: (value: MetersSettings) => void;
  setNewMemberData: (value: SettingsUiState['newMemberData']) => void;
  setNewCat: (value: string) => void;
  setIsDeleteModalOpen: (open: boolean) => void;
  setDeleteConfirmName: (value: string) => void;
  setDeleteAcknowledged: (value: boolean) => void;

  syncFromUser: (user: UserProfile | null) => void;
  openDeleteModal: () => void;
  handleProfileSave: (e: React.FormEvent) => Promise<void>;
  handlePasswordSave: (e: React.FormEvent) => Promise<void>;
  handleHouseholdNameSave: (e: React.FormEvent) => Promise<void>;
  handleModuleSave: (key: `${ModuleId}_enabled`, enabled: boolean, setSaving: (v: boolean) => void, label: string) => Promise<void>;
  handleBudgetSave: () => Promise<void>;
  handleBusinessSave: (hasShopifyToken: boolean) => Promise<void>;
  handleSavingsSave: () => Promise<void>;
  handleDebtsSave: () => Promise<void>;
  handleMetersSave: () => Promise<void>;
  handleUtilitiesSave: (utilityPartnersCount: number) => Promise<void>;
  handleAddMember: (e: React.FormEvent) => Promise<void>;
  handleDeleteHousehold: (householdDisplayName: string) => Promise<void>;
  toggleMemberPermission: (memberId: number, moduleId: string) => void;
}

const defaultMemberData = (): SettingsUiState['newMemberData'] => ({
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  role: 'editor',
  permissions: ['budget', 'utilities'],
});

export const useSettingsUiStore = create<SettingsUiState>((set, get) => ({
  activeTab: 'profile',
  localProfile: { firstName: '', lastName: '' },
  newPassword: '',
  confirmPassword: '',
  isPasswordSaving: false,
  householdName: '',
  budgetEnabled: false,
  savingsEnabled: false,
  debtsEnabled: false,
  utilitiesEnabled: false,
  metersEnabled: false,
  businessEnabled: false,
  businessName: '',
  shopifyImportEnabled: false,
  shopifyShopUrl: '',
  shopifyAccessToken: '',
  utilitySplitEnabled: false,
  utilitySplitPartnerId: null,
  businessSettings: resolveBusinessSettings(null),
  utilityTemplates: [],
  savingsSettings: resolveSavingsSettings(null),
  debtsSettings: resolveDebtsSettings(null),
  metersSettings: resolveMetersSettings(null),
  isNameSaving: false,
  isBudgetSaving: false,
  isSavingsSaving: false,
  isDebtsSaving: false,
  isUtilitiesSaving: false,
  isMetersSaving: false,
  isBusinessSaving: false,
  newMemberData: defaultMemberData(),
  newCat: '',
  isSaving: false,
  isDeleteModalOpen: false,
  deleteConfirmName: '',
  deleteAcknowledged: false,
  isDeletingHousehold: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setLocalProfile: (localProfile) => set({ localProfile }),
  setNewPassword: (newPassword) => set({ newPassword }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setHouseholdName: (householdName) => set({ householdName }),
  setBudgetEnabled: (budgetEnabled) => set({ budgetEnabled }),
  setSavingsEnabled: (savingsEnabled) => set({ savingsEnabled }),
  setDebtsEnabled: (debtsEnabled) => set({ debtsEnabled }),
  setUtilitiesEnabled: (utilitiesEnabled) => set({ utilitiesEnabled }),
  setMetersEnabled: (metersEnabled) => set({ metersEnabled }),
  setBusinessEnabled: (businessEnabled) => set({ businessEnabled }),
  setBusinessName: (businessName) => set({ businessName }),
  setShopifyImportEnabled: (shopifyImportEnabled) => set({ shopifyImportEnabled }),
  setShopifyShopUrl: (shopifyShopUrl) => set({ shopifyShopUrl }),
  setShopifyAccessToken: (shopifyAccessToken) => set({ shopifyAccessToken }),
  setUtilitySplitEnabled: (utilitySplitEnabled) => set({ utilitySplitEnabled }),
  setUtilitySplitPartnerId: (utilitySplitPartnerId) => set({ utilitySplitPartnerId }),
  setBusinessSettings: (businessSettings) => set({ businessSettings }),
  setUtilityTemplates: (utilityTemplates) => set({ utilityTemplates }),
  setSavingsSettings: (savingsSettings) => set({ savingsSettings }),
  setDebtsSettings: (debtsSettings) => set({ debtsSettings }),
  setMetersSettings: (metersSettings) => set({ metersSettings }),
  setNewMemberData: (newMemberData) => set({ newMemberData }),
  setNewCat: (newCat) => set({ newCat }),
  setIsDeleteModalOpen: (isDeleteModalOpen) => set({ isDeleteModalOpen }),
  setDeleteConfirmName: (deleteConfirmName) => set({ deleteConfirmName }),
  setDeleteAcknowledged: (deleteAcknowledged) => set({ deleteAcknowledged }),

  syncFromUser: (user) => {
    set({
      localProfile: { firstName: user?.firstName || '', lastName: user?.lastName || '' },
    });
    if (!user?.household) return;
    const h = user.household;
    set({
      householdName: h.name || '',
      budgetEnabled: h.budgetEnabled ?? h.budget_enabled ?? false,
      savingsEnabled: h.savingsEnabled ?? h.savings_enabled ?? false,
      debtsEnabled: h.debtsEnabled ?? h.debts_enabled ?? false,
      utilitiesEnabled: h.utilitiesEnabled ?? h.utilities_enabled ?? false,
      metersEnabled: h.metersEnabled ?? h.meters_enabled ?? false,
      businessEnabled: h.businessEnabled ?? h.business_enabled ?? false,
      businessName: h.businessName ?? h.business_name ?? '',
      shopifyImportEnabled: (() => {
        const raw = h.shopifyImportEnabled ?? h.shopify_import_enabled ?? false;
        return raw && canUseFeature(user, 'shopify_import');
      })(),
      shopifyShopUrl: h.shopifyShopUrl ?? h.shopify_shop_url ?? '',
      shopifyAccessToken: '',
      utilitySplitEnabled: (() => {
        const raw = h.utilitySplitEnabled ?? h.utility_split_enabled ?? false;
        return raw && canUseFeature(user, 'utility_split');
      })(),
      utilitySplitPartnerId: h.utilitySplitPartnerId ?? h.utility_split_partner_id ?? null,
      businessSettings: resolveBusinessSettings(h),
      utilityTemplates: resolveUtilityTemplates(h),
      savingsSettings: resolveSavingsSettings(h),
      debtsSettings: resolveDebtsSettings(h),
      metersSettings: resolveMetersSettings(h),
    });
  },

  openDeleteModal: () => set({ deleteConfirmName: '', deleteAcknowledged: false, isDeleteModalOpen: true }),

  handleProfileSave: async (e) => {
    e.preventDefault();
    const { localProfile } = get();
    const { updateUser } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    set({ isSaving: true });
    try {
      await updateUser(localProfile);
      addNotification('Profil sikeresen mentve!', 'success');
    } catch {
      addNotification('Sikertelen mentés.', 'error');
    } finally {
      set({ isSaving: false });
    }
  },

  handlePasswordSave: async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = get();
    const { updateUser } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    if (newPassword.length < 8) {
      addNotification('A jelszónak legalább 8 karakterből kell állnia!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addNotification('A két jelszó nem egyezik meg!', 'error');
      return;
    }
    set({ isPasswordSaving: true });
    try {
      await updateUser({ password: newPassword, password_confirmation: confirmPassword } as Parameters<typeof updateUser>[0]);
      set({ newPassword: '', confirmPassword: '' });
      addNotification('Jelszó sikeresen megváltoztatva!', 'success');
    } catch {
      addNotification('Nem sikerült megváltoztatni a jelszót.', 'error');
    } finally {
      set({ isPasswordSaving: false });
    }
  },

  handleHouseholdNameSave: async (e) => {
    e.preventDefault();
    const { householdName } = get();
    const { updateHouseholdSettings } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    set({ isNameSaving: true });
    try {
      await updateHouseholdSettings({ name: householdName });
      addNotification('Háztartás neve mentve.', 'success');
    } catch {
      addNotification('A név mentése nem sikerült.', 'error');
    } finally {
      set({ isNameSaving: false });
    }
  },

  handleModuleSave: async (key, enabled, setSaving, label) => {
    const { updateHouseholdSettings } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    setSaving(true);
    try {
      await updateHouseholdSettings({ [key]: enabled });
      addNotification(`${label} modul mentve.`, 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setSaving(false);
    }
  },

  handleBudgetSave: async () => {
    const { budgetEnabled, handleModuleSave } = get();
    await handleModuleSave('budget_enabled', budgetEnabled, (v) => set({ isBudgetSaving: v }), 'Költségvetés');
  },

  handleBusinessSave: async (hasShopifyToken) => {
    const {
      businessEnabled,
      businessName,
      shopifyImportEnabled,
      shopifyShopUrl,
      shopifyAccessToken,
      businessSettings,
    } = get();
    const user = useAuthStore.getState().user;
    const { updateHouseholdSettings } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    if (businessEnabled && !moduleEnableAllowed(user, 'business')) {
      addNotification('A vállalkozás modul nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    if (businessEnabled) {
      if (!businessName.trim()) {
        addNotification('A vállalkozás nevét kötelező megadni, ha a modul be van kapcsolva!', 'error');
        return;
      }
      if (shopifyImportEnabled) {
        if (!featureEnableAllowed(user, 'shopify_import')) {
          addNotification('A Shopify import nem érhető el a jelenlegi csomagodban.', 'error');
          return;
        }
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
    set({ isBusinessSaving: true });
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
      set({ shopifyAccessToken: '' });
      addNotification('Vállalkozás modul mentve.', 'success');
    } catch {
      addNotification('A vállalkozás mentése nem sikerült.', 'error');
    } finally {
      set({ isBusinessSaving: false });
    }
  },

  handleSavingsSave: async () => {
    const { savingsEnabled, savingsSettings } = get();
    const user = useAuthStore.getState().user;
    const { updateHouseholdSettings } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    if (savingsEnabled && !moduleEnableAllowed(user, 'savings')) {
      addNotification('A megtakarítás modul nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    set({ isSavingsSaving: true });
    try {
      await updateHouseholdSettings({
        savings_enabled: savingsEnabled,
        savings_settings: savingsSettingsForApi(savingsSettings),
      });
      addNotification('Megtakarítás modul mentve.', 'success');
    } catch {
      addNotification('A megtakarítás mentése nem sikerült.', 'error');
    } finally {
      set({ isSavingsSaving: false });
    }
  },

  handleDebtsSave: async () => {
    const { debtsEnabled, debtsSettings } = get();
    const user = useAuthStore.getState().user;
    const { updateHouseholdSettings } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    if (debtsEnabled && !moduleEnableAllowed(user, 'debts')) {
      addNotification('A tartozások modul nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    set({ isDebtsSaving: true });
    try {
      await updateHouseholdSettings({ debts_enabled: debtsEnabled, debts_settings: debtsSettings });
      addNotification('Tartozások modul mentve.', 'success');
    } catch {
      addNotification('A tartozások mentése nem sikerült.', 'error');
    } finally {
      set({ isDebtsSaving: false });
    }
  },

  handleMetersSave: async () => {
    const { metersEnabled, metersSettings } = get();
    const user = useAuthStore.getState().user;
    const { updateHouseholdSettings } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    if (metersEnabled && !moduleEnableAllowed(user, 'meters')) {
      addNotification('A közműórák modul nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    set({ isMetersSaving: true });
    try {
      await updateHouseholdSettings({ meters_enabled: metersEnabled, meters_settings: metersSettings });
      addNotification('Közműórák modul mentve.', 'success');
    } catch {
      addNotification('A közműórák mentése nem sikerült.', 'error');
    } finally {
      set({ isMetersSaving: false });
    }
  },

  handleUtilitiesSave: async (utilityPartnersCount) => {
    const { utilitiesEnabled, utilitySplitEnabled, utilitySplitPartnerId, utilityTemplates } = get();
    const user = useAuthStore.getState().user;
    const { updateHouseholdSettings } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    if (utilitiesEnabled && !moduleEnableAllowed(user, 'utilities')) {
      addNotification('A rezsi modul nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    if (utilitiesEnabled && utilitySplitEnabled && !featureEnableAllowed(user, 'utility_split')) {
      addNotification('A rezsi megosztás nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    if (utilitiesEnabled && utilitySplitEnabled && utilityPartnersCount > 0 && !utilitySplitPartnerId) {
      addNotification('Válassz elszámolási partnert a rezsi megosztáshoz!', 'error');
      return;
    }
    set({ isUtilitiesSaving: true });
    try {
      await updateHouseholdSettings({
        utilities_enabled: utilitiesEnabled,
        utility_split_enabled: utilitiesEnabled ? utilitySplitEnabled : false,
        utility_split_partner_id: utilitiesEnabled && utilitySplitEnabled ? utilitySplitPartnerId : null,
        utility_templates: utilityTemplates.filter((t) => t.type.trim()),
      });
      set({ utilityTemplates: resolveUtilityTemplates(useAuthStore.getState().user?.household) });
      addNotification('Rezsi modul mentve.', 'success');
    } catch {
      addNotification('A rezsi modul mentése nem sikerült.', 'error');
    } finally {
      set({ isUtilitiesSaving: false });
    }
  },

  handleAddMember: async (e) => {
    e.preventDefault();
    const { newMemberData } = get();
    const { addMember } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
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
    set({ newMemberData: defaultMemberData() });
  },

  handleDeleteHousehold: async (householdDisplayName) => {
    const { deleteConfirmName, deleteAcknowledged, isDeletingHousehold } = get();
    const deleteNameMatches = deleteConfirmName.trim() === householdDisplayName.trim();
    const canConfirmDelete = deleteNameMatches && deleteAcknowledged && !isDeletingHousehold;
    if (!canConfirmDelete) return;
    const { deleteHousehold } = useAuthStore.getState();
    const { addNotification } = useNotificationStore.getState();
    set({ isDeletingHousehold: true });
    try {
      await deleteHousehold(deleteConfirmName.trim());
    } catch {
      addNotification('A törlés nem sikerült. Ellenőrizd a háztartás nevét.', 'error');
      set({ isDeletingHousehold: false });
    }
  },

  toggleMemberPermission: (memberId, moduleId) => {
    const user = useAuthStore.getState().user;
    const member = user?.household?.users?.find((u) => u.id === memberId);
    if (!member) return;
    const currentPermissions = member.permissions || [];
    const newPermissions = currentPermissions.includes(moduleId)
      ? currentPermissions.filter((p) => p !== moduleId)
      : [...currentPermissions, moduleId];
    useAuthStore.getState().patchMemberLocally(memberId, { permissions: newPermissions });
    void useAuthStore.getState().updateMember(memberId, { permissions: newPermissions });
  },
}));
