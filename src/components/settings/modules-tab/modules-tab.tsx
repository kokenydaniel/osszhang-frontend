'use client';

import {
  Droplets,
  FolderTree,
  Gauge,
  Lock,
  PiggyBank,
  Plus,
  Save,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { BusinessOptionsEditor } from '@/components/settings/modules-tab/editors/BusinessOptionsEditor';
import { BudgetSettingsEditor } from '@/components/settings/modules-tab/editors/BudgetSettingsEditor';
import { DashboardSettingsEditor } from '@/components/settings/modules-tab/editors/DashboardSettingsEditor';
import { DebtsSettingsEditor } from '@/components/settings/modules-tab/editors/DebtsSettingsEditor';
import { MetersSettingsEditor } from '@/components/settings/modules-tab/editors/MetersSettingsEditor';
import { SavingsSettingsEditor } from '@/components/settings/modules-tab/editors/SavingsSettingsEditor';
import { UtilitiesSettingsEditor } from '@/components/settings/modules-tab/editors/UtilitiesSettingsEditor';
import { UtilityTemplatesEditor } from '@/components/settings/modules-tab/editors/UtilityTemplatesEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/config/help';
import { formatDisplayName } from '@/utils/person-name';
import { blockModuleEnable } from '@/helpers/module-tier-gate';
import { canAccessModuleByTier, showTierBadgeForModule } from '@/helpers/check-access';
import type { ModuleId } from '@/helpers/module-access';
import { useAuthStore } from '@/stores/useAuthStore';
import { householdClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import type { HouseholdProfile } from '@/types';

import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { InsightBanner, StatusPill } from '@/components/design';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import { TierFeatureSwitchRow } from '@/components/subscription/TierFeatureSwitchRow';
import { ModuleFeatureCard } from '@/components/settings/blocks/module-feature-card';
import { SettingsDivider } from '@/components/settings/blocks/settings-divider';
import { SettingsSectionHeading } from '@/components/settings/blocks/settings-section-heading';
import { CategoryTag } from '@/components/settings/chips/category-tag';

import { resolveBusinessSettings } from '@/settings/business';
import { budgetSettingsForApi, resolveBudgetSettings, resolveCategoryColor } from '@/settings/budget';
import { resolveDashboardSettings } from '@/settings/dashboard';
import { resolveUtilityTemplates } from '@/config/utility-templates';
import { resolveSavingsSettings, savingsSettingsForApi } from '@/settings/savings';
import { debtsSettingsForApi, resolveDebtsSettings } from '@/settings/debts';
import { metersSettingsForApi, resolveMetersSettings } from '@/settings/meters';
import { resolveUtilitiesSettings } from '@/settings/utilities';
import { featureEnableAllowed, moduleEnableAllowed } from '@/helpers/module-tier-gate';
import { canUseFeature } from '@/helpers/check-access';

export function SettingsModulesTab() {
  const { user } = useAuthStore();
  const householdCats = user?.household?.categories ?? [];
  const [categories, setCategories] = useState<string[]>(householdCats);
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const isAdmin = user?.role === 'admin';
  const { allowed: shopifyAllowed } = useTierFeature('shopify_import');

  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [savingsEnabled, setSavingsEnabled] = useState(false);
  const [debtsEnabled, setDebtsEnabled] = useState(false);
  const [utilitiesEnabled, setUtilitiesEnabled] = useState(false);
  const [metersEnabled, setMetersEnabled] = useState(false);
  const [businessEnabled, setBusinessEnabled] = useState(false);
  
  const [businessName, setBusinessName] = useState('');
  const [shopifyImportEnabled, setShopifyImportEnabled] = useState(false);
  const [shopifyShopUrl, setShopifyShopUrl] = useState('');
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');
  
  const [utilitySplitEnabled, setUtilitySplitEnabled] = useState(false);
  const [utilitySplitPartnerId, setUtilitySplitPartnerId] = useState<number | null>(null);
  
  const [businessSettings, setBusinessSettings] = useState(() => resolveBusinessSettings(null));
  const [utilityTemplates, setUtilityTemplates] = useState(() => resolveUtilityTemplates(null));
  const [savingsSettings, setSavingsSettings] = useState(() => resolveSavingsSettings(null));
  const [debtsSettings, setDebtsSettings] = useState(() => resolveDebtsSettings(null));
  const [metersSettings, setMetersSettings] = useState(() => resolveMetersSettings(null));
  const [budgetSettings, setBudgetSettings] = useState(() => resolveBudgetSettings(null));
  const [utilitiesSettings, setUtilitiesSettings] = useState(() => resolveUtilitiesSettings(null));
  const [dashboardSettings, setDashboardSettings] = useState(() => resolveDashboardSettings(null));

  const [isBudgetSaving, setIsBudgetSaving] = useState(false);
  const [isDashboardSaving, setIsDashboardSaving] = useState(false);
  const [isSavingsSaving, setIsSavingsSaving] = useState(false);
  const [isDebtsSaving, setIsDebtsSaving] = useState(false);
  const [isUtilitiesSaving, setIsUtilitiesSaving] = useState(false);
  const [isMetersSaving, setIsMetersSaving] = useState(false);
  const [isBusinessSaving, setIsBusinessSaving] = useState(false);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    if (user?.household) {
      const h = user.household;
      setBudgetEnabled(h.budget_enabled ?? h.budget_enabled ?? false);
      setSavingsEnabled(h.savings_enabled ?? h.savings_enabled ?? false);
      setDebtsEnabled(h.debts_enabled ?? h.debts_enabled ?? false);
      setUtilitiesEnabled(h.utilities_enabled ?? h.utilities_enabled ?? false);
      setMetersEnabled(h.meters_enabled ?? h.meters_enabled ?? false);
      setBusinessEnabled(h.business_enabled ?? h.business_enabled ?? false);
      setBusinessName(h.business_name ?? h.business_name ?? '');
      
      const rawShopify = h.shopify_import_enabled ?? h.shopify_import_enabled ?? false;
      setShopifyImportEnabled(rawShopify && canUseFeature(user, 'shopify_import'));
      setShopifyShopUrl(h.shopify_shop_url ?? h.shopify_shop_url ?? '');
      
      const rawUtility = h.utility_split_enabled ?? h.utility_split_enabled ?? false;
      setUtilitySplitEnabled(rawUtility && canUseFeature(user, 'utility_split'));
      setUtilitySplitPartnerId(h.utility_split_partner_id ?? h.utility_split_partner_id ?? null);
      
      setBusinessSettings(resolveBusinessSettings(h));
      setUtilityTemplates(resolveUtilityTemplates(h));
      setSavingsSettings(resolveSavingsSettings(h));
      setDebtsSettings(resolveDebtsSettings(h));
      setMetersSettings(resolveMetersSettings(h));
      setBudgetSettings(resolveBudgetSettings(h));
      setUtilitiesSettings(resolveUtilitiesSettings(h));
      setDashboardSettings(resolveDashboardSettings(h));
    }
  }, [user]);

  const addCategory = async (cat: string) => {
    const updated = [...categories, cat];
    try {
      const res = await householdClient.updateCategories(updated);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error();
      setCategories(updated);
    } catch (e) {
      console.error('Failed to add category', e);
    }
  };

  const applySavedHousehold = async (
    res: Awaited<ReturnType<typeof householdClient.update>>,
  ) => {
    if (!res || res[0] !== StatusCodes.Http200) throw new Error();
    useAuthStore.getState().patchHousehold(res[1] as HouseholdProfile);
    await useAuthStore.getState().fetchMe();
  };

  const deleteCategory = async (cat: string) => {
    const updated = categories.filter((c: string) => c !== cat);
    try {
      const res = await householdClient.updateCategories(updated);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error();
      setCategories(updated);
    } catch (e) {
      console.error('Failed to delete category', e);
    }
  };

  const handleModuleSave = async (key: string, enabled: boolean, setSaving: (v: boolean) => void, label: string) => {
    setSaving(true);
    try {
      await applySavedHousehold(await householdClient.update({ [key]: enabled }));
      addNotification(`${label} modul mentve.`, 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBudgetSave = async () => {
    setIsBudgetSaving(true);
    try {
      await applySavedHousehold(
        await householdClient.update({
          budget_enabled: budgetEnabled,
          budget_settings: budgetSettingsForApi(budgetSettings),
        }),
      );
      addNotification('Költségvetés modul mentve.', 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setIsBudgetSaving(false);
    }
  };

  const handleDashboardSave = async () => {
    setIsDashboardSaving(true);
    try {
      await applySavedHousehold(
        await householdClient.update({ dashboard_settings: dashboardSettings }),
      );
      addNotification('Vezérlőpult beállítások mentve.', 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setIsDashboardSaving(false);
    }
  };

  const hasShopifyToken = user?.household?.has_shopify_token ?? user?.household?.has_shopify_token ?? false;

  const handleBusinessSave = async () => {
    if (businessEnabled && !moduleEnableAllowed(user, 'business')) {
      addNotification('A vállalkozás modul nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    if (businessEnabled && !businessName.trim()) {
      addNotification('A vállalkozás nevét kötelező megadni, ha a modul be van kapcsolva!', 'error');
      return;
    }
    if (businessEnabled && shopifyImportEnabled) {
      if (!featureEnableAllowed(user, 'shopify_import')) {
        addNotification('A Shopify import nem érhető el a jelenlegi csomagodban.', 'error');
        return;
      }
      if (!shopifyShopUrl.trim()) {
        addNotification('A Shopify bolt URL-jét kötelező megadni!', 'error');
        return;
      }
      if (!hasShopifyToken && !shopifyAccessToken.trim()) {
        addNotification('Az Admin API tokent kötelező megadni az első mentésnél!', 'error');
        return;
      }
    }
    setIsBusinessSaving(true);
    try {
      const payload: any = {
        business_enabled: businessEnabled,
        business_name: businessName,
        shopify_import_enabled: businessEnabled ? shopifyImportEnabled : false,
        business_settings: businessSettings,
      };
      if (businessEnabled && shopifyImportEnabled) payload.shopify_shop_url = shopifyShopUrl;
      if (shopifyAccessToken.trim()) payload.shopify_access_token = shopifyAccessToken.trim();
      
      await applySavedHousehold(await householdClient.update(payload));
      setShopifyAccessToken('');
      addNotification('Vállalkozás modul mentve.', 'success');
    } catch {
      addNotification('A vállalkozás mentése nem sikerült.', 'error');
    } finally {
      setIsBusinessSaving(false);
    }
  };

  const handleSavingsSave = async () => {
    if (savingsEnabled && !moduleEnableAllowed(user, 'savings')) {
      addNotification('A megtakarítás modul nem érhető el a jelenlegi csomagodban.', 'error');
      return;
    }
    setIsSavingsSaving(true);
    try {
      await applySavedHousehold(
        await householdClient.update({
          savings_enabled: savingsEnabled,
          savings_settings: savingsSettingsForApi(savingsSettings),
        }),
      );
      addNotification('Megtakarítás modul mentve.', 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setIsSavingsSaving(false);
    }
  };

  const handleDebtsSave = async () => {
    if (debtsEnabled && !moduleEnableAllowed(user, 'debts')) {
      addNotification('A tartozások modul nem érhető el.', 'error');
      return;
    }
    setIsDebtsSaving(true);
    try {
      await applySavedHousehold(
        await householdClient.update({
          debts_enabled: debtsEnabled,
          debts_settings: debtsSettingsForApi(debtsSettings),
        }),
      );
      addNotification('Tartozások modul mentve.', 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setIsDebtsSaving(false);
    }
  };

  const handleMetersSave = async () => {
    setIsMetersSaving(true);
    try {
      await applySavedHousehold(
        await householdClient.update({
          meters_enabled: metersEnabled,
          meters_settings: metersSettingsForApi(metersSettings),
        }),
      );
      addNotification('Közműórák modul mentve.', 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setIsMetersSaving(false);
    }
  };

  const handleUtilitiesSave = async () => {
    if (utilitiesEnabled && utilitySplitEnabled && !featureEnableAllowed(user, 'utility_split')) {
      addNotification('A rezsi megosztás nem érhető el.', 'error');
      return;
    }
    setIsUtilitiesSaving(true);
    try {
      await applySavedHousehold(
        await householdClient.update({
          utilities_enabled: utilitiesEnabled,
          utility_split_enabled: utilitiesEnabled ? utilitySplitEnabled : false,
          utility_split_partner_id: utilitiesEnabled && utilitySplitEnabled ? utilitySplitPartnerId : null,
          utilities_settings: utilitiesSettings,
          utility_templates: utilityTemplates.filter((t) => t.type.trim()),
        }),
      );
      addNotification('Rezsi modul mentve.', 'success');
    } catch {
      addNotification('A mentés nem sikerült.', 'error');
    } finally {
      setIsUtilitiesSaving(false);
    }
  };

  const utilityPartners = user?.household?.users?.filter((u) => u.id !== user?.id) || [];

  const moduleCardProps = (moduleId: ModuleId, enabled: boolean, setter: (value: boolean) => void) => {
    const allowed = canAccessModuleByTier(user, moduleId);
    const badgeTier = showTierBadgeForModule(user, moduleId);

    return {
      tierBadge: badgeTier === 'premium' ? ('premium' as const) : badgeTier === 'pro' ? ('pro' as const) : null,
      onToggle: (next: boolean) => {
        if (blockModuleEnable(user, moduleId, next)) return;
        setter(next);
      },
      tierLocked: enabled && !allowed,
    };
  };

  const savingsProps = moduleCardProps('savings', savingsEnabled, setSavingsEnabled);
  const debtsProps = moduleCardProps('debts', debtsEnabled, setDebtsEnabled);
  const utilitiesProps = moduleCardProps('utilities', utilitiesEnabled, setUtilitiesEnabled);
  const metersProps = moduleCardProps('meters', metersEnabled, setMetersEnabled);
  const businessProps = moduleCardProps('business', businessEnabled, setBusinessEnabled);

  return (
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
            onToggle={(next) => setBudgetEnabled(next)}
            icon={<Wallet size={22} strokeWidth={2} />}
            iconClassName="bg-emerald-500/12 text-emerald-600 border border-emerald-500/20"
            footer={
              <Button type="button" onClick={() => void handleBudgetSave()} loading={isBudgetSaving} disabled={isBudgetSaving}>
                <Save size={13} />
                {isBudgetSaving ? 'Mentés…' : 'Költségvetés mentése'}
              </Button>
            }
          >
            <SettingsDivider />
            <BudgetSettingsEditor
              value={budgetSettings}
              onChange={setBudgetSettings}
              categories={categories}
            />
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
                {categories.map((cat: string) => (
                  <CategoryTag
                    key={cat}
                    name={cat}
                    color={resolveCategoryColor(cat, budgetSettings)}
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
            tierBadge={savingsProps.tierBadge}
            onToggle={savingsProps.onToggle}
            icon={<PiggyBank size={22} strokeWidth={2} />}
            iconClassName="bg-violet-500/12 text-violet-600 border border-violet-500/20"
            footer={
              <Button type="button" onClick={() => void handleSavingsSave()} loading={isSavingsSaving} disabled={isSavingsSaving}>
                <Save size={13} />
                {isSavingsSaving ? 'Mentés…' : 'Megtakarítás mentése'}
              </Button>
            }
          >
            {savingsProps.tierLocked ? (
              <InsightBanner tone="warning" icon={ShieldAlert} title="Nincs a csomagodban">
                Ez a modul a Pro csomag része. Kapcsold ki, vagy válts magasabb csomagra a mentéshez.
              </InsightBanner>
            ) : null}
            <SavingsSettingsEditor value={savingsSettings} onChange={setSavingsSettings} />
          </ModuleFeatureCard>

          <ModuleFeatureCard
            title="Tartozások"
            description="Hitelek, kölcsönök és visszafizetési tervek."
            enabled={debtsEnabled}
            tierBadge={debtsProps.tierBadge}
            onToggle={debtsProps.onToggle}
            icon={<TrendingDown size={22} strokeWidth={2} />}
            iconClassName="bg-rose-500/12 text-rose-600 border border-rose-500/20"
            footer={
              <Button type="button" onClick={() => void handleDebtsSave()} loading={isDebtsSaving} disabled={isDebtsSaving}>
                <Save size={13} />
                {isDebtsSaving ? 'Mentés…' : 'Tartozások mentése'}
              </Button>
            }
          >
            {debtsProps.tierLocked ? (
              <InsightBanner tone="warning" icon={ShieldAlert} title="Nincs a csomagodban">
                Ez a modul a Pro csomag része. Kapcsold ki, vagy válts magasabb csomagra a mentéshez.
              </InsightBanner>
            ) : null}
            <DebtsSettingsEditor value={debtsSettings} onChange={setDebtsSettings} />
          </ModuleFeatureCard>

          <ModuleFeatureCard
            title="Rezsi"
            description="Közüzemi számlák, megosztás és havi sablon tételek."
            enabled={utilitiesEnabled}
            tierBadge={utilitiesProps.tierBadge}
            onToggle={utilitiesProps.onToggle}
            icon={<Droplets size={22} strokeWidth={2} />}
            iconClassName="bg-sky-500/12 text-sky-600 border border-sky-500/20"
            footer={
              <Button type="button" onClick={() => void handleUtilitiesSave()} loading={isUtilitiesSaving} disabled={isUtilitiesSaving}>
                <Save size={13} />
                {isUtilitiesSaving ? 'Mentés…' : 'Rezsi mentése'}
              </Button>
            }
          >
            {utilitiesProps.tierLocked ? (
              <InsightBanner tone="warning" icon={ShieldAlert} title="Nincs a csomagodban">
                Ez a modul a Pro csomag része. Kapcsold ki, vagy válts magasabb csomagra a mentéshez.
              </InsightBanner>
            ) : null}
            <div className="space-y-4">
              <TierFeatureSwitchRow
                feature="utility_split"
                featureLabel="Rezsi megosztás"
                title="Rezsi megosztás"
                description="Közös számlák elszámolása partnerekkel."
                checked={utilitySplitEnabled}
                onCheckedChange={setUtilitySplitEnabled}
                disabled={!utilitiesEnabled}
              />
              {utilitySplitEnabled && utilitiesEnabled ? (
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
                          {formatDisplayName(p.first_name, p.last_name)}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>
              ) : null}
            </div>

            <SettingsDivider />

            <UtilitiesSettingsEditor
              value={utilitiesSettings}
              onChange={setUtilitiesSettings}
              members={user?.household?.users ?? []}
            />

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
            tierBadge={metersProps.tierBadge}
            onToggle={metersProps.onToggle}
            icon={<Gauge size={22} strokeWidth={2} />}
            iconClassName="bg-amber-500/12 text-amber-600 border border-amber-500/20"
            footer={
              <Button type="button" onClick={() => void handleMetersSave()} loading={isMetersSaving} disabled={isMetersSaving}>
                <Save size={13} />
                {isMetersSaving ? 'Mentés…' : 'Közműórák mentése'}
              </Button>
            }
          >
            {metersProps.tierLocked ? (
              <InsightBanner tone="warning" icon={ShieldAlert} title="Nincs a csomagodban">
                Ez a modul a Pro csomag része. Kapcsold ki, vagy válts magasabb csomagra a mentéshez.
              </InsightBanner>
            ) : null}
            <MetersSettingsEditor value={metersSettings} onChange={setMetersSettings} />
          </ModuleFeatureCard>

          <ModuleFeatureCard
            title="Vállalkozás"
            description="Rendelések nyilvántartása, csatornák és fizetési módok — Shopify import opcionálisan."
            enabled={businessEnabled}
            tierBadge={businessProps.tierBadge}
            onToggle={businessProps.onToggle}
            icon={<TrendingUp size={22} strokeWidth={2} />}
            iconClassName="bg-emerald-500/12 text-emerald-600 border border-emerald-500/20"
            footer={
              <Button type="button" onClick={() => void handleBusinessSave()} loading={isBusinessSaving} disabled={isBusinessSaving}>
                <Save size={13} />
                {isBusinessSaving ? 'Mentés…' : 'Vállalkozás mentése'}
              </Button>
            }
          >
            {businessProps.tierLocked ? (
              <InsightBanner tone="warning" icon={ShieldAlert} title="Nincs a csomagodban">
                Ez a modul a Premium csomag része. Kapcsold ki, vagy válts magasabb csomagra a mentéshez.
              </InsightBanner>
            ) : null}
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
              <TierFeatureSwitchRow
                feature="shopify_import"
                featureLabel="Shopify import"
                title="Shopify import"
                description="Ha Shopify webshopod van, automatikusan importálhatod a rendeléseket. Kikapcsolva manuálisan rögzítheted őket."
                checked={shopifyImportEnabled}
                onCheckedChange={setShopifyImportEnabled}
                disabled={!businessEnabled}
              />

              {shopifyImportEnabled && businessEnabled && shopifyAllowed ? (
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
              ) : null}
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

      {isAdmin && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Vezérlőpult</h3>
            <p className="text-sm text-muted-foreground mt-1">Widget sorrend és megjelenés — egész háztartásra érvényes.</p>
          </div>
          <DashboardSettingsEditor value={dashboardSettings} onChange={setDashboardSettings} />
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => void handleDashboardSave()} loading={isDashboardSaving} disabled={isDashboardSaving}>
              <Save size={13} />
              {isDashboardSaving ? 'Mentés…' : 'Vezérlőpult mentése'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteModal />
    </>
  );
}
