import { useEffect } from 'react';
import {
  Droplets,
  Gauge,
  Home,
  LayoutGrid,
  PiggyBank,
  ShoppingBag,
  TrendingDown,
  User,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { type ModuleId } from '@/lib/moduleAccess';

export type { SettingsTabId } from '@/stores/useSettingsUiStore';

export function useSettingsState() {
  const { categories, addCategory, deleteCategory } = useBudgetStore();
  const { user, updateMember, patchMemberLocally, removeMember } = useAuthStore();
  const ui = useSettingsUiStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  useEffect(() => {
    useSettingsUiStore.getState().syncFromUser(user);
  }, [user]);

  const hasShopifyToken = user?.household?.hasShopifyToken ?? user?.household?.has_shopify_token ?? false;
  const isAdmin = user?.role === 'admin';
  const householdDisplayName = user?.household?.name || '';
  const deleteNameMatches = ui.deleteConfirmName.trim() === householdDisplayName.trim();
  const canConfirmDelete = deleteNameMatches && ui.deleteAcknowledged && !ui.isDeletingHousehold;
  const utilityPartners = user?.household?.users?.filter((u) => u.id !== user.id) || [];

  const modules = [
    { id: 'budget' as ModuleId, label: 'Költségvetés', icon: Wallet, description: '/budget — bevételek, kiadások' },
    { id: 'savings' as ModuleId, label: 'Megtakarítások', icon: PiggyBank, description: '/savings — Széf, állampapírok' },
    { id: 'debts' as ModuleId, label: 'Tartozások', icon: TrendingDown, description: '/debts — hitelek, kölcsönök' },
    { id: 'utilities' as ModuleId, label: 'Rezsi', icon: Droplets, description: '/utilities — közüzemi számlák' },
    { id: 'meters' as ModuleId, label: 'Közműórák', icon: Gauge, description: '/meters — fogyasztás' },
    { id: 'business' as ModuleId, label: ui.businessEnabled ? ui.businessName : 'Vállalkozás', icon: ShoppingBag, description: '/business — webshop' },
  ];

  const moduleEnabledState: Record<ModuleId, boolean> = {
    budget: ui.budgetEnabled,
    savings: ui.savingsEnabled,
    debts: ui.debtsEnabled,
    utilities: ui.utilitiesEnabled,
    meters: ui.metersEnabled,
    business: ui.businessEnabled,
  };

  const activeMemberModules = modules.filter((mod) => moduleEnabledState[mod.id]);

  const settingsTabs = [
    { id: 'profile' as const, label: 'Profilom', icon: User, hint: 'Személyes adatok, jelszó, fiók törlése' },
    { id: 'household' as const, label: 'Háztartás', icon: Home, hint: 'Név, családtagok, jogosultságok' },
    { id: 'modules' as const, label: 'Modulok', icon: LayoutGrid, hint: 'Bekapcsolható funkciók és beállításaik' },
  ];

  return {
    activeTab: ui.activeTab,
    setActiveTab: ui.setActiveTab,
    settingsTabs,
    user,
    isAdmin,
    categories,
    addCategory,
    deleteCategory,
    localProfile: ui.localProfile,
    setLocalProfile: ui.setLocalProfile,
    newPassword: ui.newPassword,
    setNewPassword: ui.setNewPassword,
    confirmPassword: ui.confirmPassword,
    setConfirmPassword: ui.setConfirmPassword,
    isPasswordSaving: ui.isPasswordSaving,
    isSaving: ui.isSaving,
    handleProfileSave: ui.handleProfileSave,
    handlePasswordSave: ui.handlePasswordSave,
    householdName: ui.householdName,
    setHouseholdName: ui.setHouseholdName,
    isNameSaving: ui.isNameSaving,
    handleHouseholdNameSave: ui.handleHouseholdNameSave,
    newMemberData: ui.newMemberData,
    setNewMemberData: ui.setNewMemberData,
    handleAddMember: ui.handleAddMember,
    activeMemberModules,
    toggleMemberPermission: ui.toggleMemberPermission,
    patchMemberLocally,
    updateMember,
    removeMember,
    requestDelete,
    budgetEnabled: ui.budgetEnabled,
    setBudgetEnabled: ui.setBudgetEnabled,
    savingsEnabled: ui.savingsEnabled,
    setSavingsEnabled: ui.setSavingsEnabled,
    debtsEnabled: ui.debtsEnabled,
    setDebtsEnabled: ui.setDebtsEnabled,
    utilitiesEnabled: ui.utilitiesEnabled,
    setUtilitiesEnabled: ui.setUtilitiesEnabled,
    metersEnabled: ui.metersEnabled,
    setMetersEnabled: ui.setMetersEnabled,
    businessEnabled: ui.businessEnabled,
    setBusinessEnabled: ui.setBusinessEnabled,
    businessName: ui.businessName,
    setBusinessName: ui.setBusinessName,
    shopifyImportEnabled: ui.shopifyImportEnabled,
    setShopifyImportEnabled: ui.setShopifyImportEnabled,
    shopifyShopUrl: ui.shopifyShopUrl,
    setShopifyShopUrl: ui.setShopifyShopUrl,
    shopifyAccessToken: ui.shopifyAccessToken,
    setShopifyAccessToken: ui.setShopifyAccessToken,
    hasShopifyToken,
    utilitySplitEnabled: ui.utilitySplitEnabled,
    setUtilitySplitEnabled: ui.setUtilitySplitEnabled,
    utilitySplitPartnerId: ui.utilitySplitPartnerId,
    setUtilitySplitPartnerId: ui.setUtilitySplitPartnerId,
    utilityPartners,
    businessSettings: ui.businessSettings,
    setBusinessSettings: ui.setBusinessSettings,
    utilityTemplates: ui.utilityTemplates,
    setUtilityTemplates: ui.setUtilityTemplates,
    savingsSettings: ui.savingsSettings,
    setSavingsSettings: ui.setSavingsSettings,
    debtsSettings: ui.debtsSettings,
    setDebtsSettings: ui.setDebtsSettings,
    metersSettings: ui.metersSettings,
    setMetersSettings: ui.setMetersSettings,
    isBudgetSaving: ui.isBudgetSaving,
    isSavingsSaving: ui.isSavingsSaving,
    isDebtsSaving: ui.isDebtsSaving,
    isUtilitiesSaving: ui.isUtilitiesSaving,
    isMetersSaving: ui.isMetersSaving,
    isBusinessSaving: ui.isBusinessSaving,
    handleModuleSave: ui.handleModuleSave,
    handleBudgetSave: ui.handleBudgetSave,
    handleBusinessSave: () => ui.handleBusinessSave(hasShopifyToken),
    handleSavingsSave: ui.handleSavingsSave,
    handleDebtsSave: ui.handleDebtsSave,
    handleMetersSave: ui.handleMetersSave,
    handleUtilitiesSave: () => ui.handleUtilitiesSave(utilityPartners.length),
    newCat: ui.newCat,
    setNewCat: ui.setNewCat,
    isDeleteModalOpen: ui.isDeleteModalOpen,
    setIsDeleteModalOpen: ui.setIsDeleteModalOpen,
    deleteConfirmName: ui.deleteConfirmName,
    setDeleteConfirmName: ui.setDeleteConfirmName,
    deleteAcknowledged: ui.deleteAcknowledged,
    setDeleteAcknowledged: ui.setDeleteAcknowledged,
    isDeletingHousehold: ui.isDeletingHousehold,
    householdDisplayName,
    canConfirmDelete,
    handleDeleteHousehold: () => ui.handleDeleteHousehold(householdDisplayName),
    openDeleteModal: ui.openDeleteModal,
    ConfirmDeleteModal,
  };
}

export type SettingsState = ReturnType<typeof useSettingsState>;
