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
import { BusinessOptionsEditor } from '@/components/modules/settings/BusinessOptionsEditor';
import { DebtsSettingsEditor } from '@/components/modules/settings/DebtsSettingsEditor';
import { MetersSettingsEditor } from '@/components/modules/settings/MetersSettingsEditor';
import { SavingsSettingsEditor } from '@/components/modules/settings/SavingsSettingsEditor';
import { UtilityTemplatesEditor } from '@/components/modules/settings/UtilityTemplatesEditor';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/lib/helpTexts';
import { formatDisplayName } from '@/lib/personName';
import { InsightBanner, StatusPill } from '@/components/design';
import { TierFeatureGate, useTierFeature } from '@/components/subscription/TierFeatureGate';
import {
  CategoryTag,
  ModuleFeatureCard,
  SettingsDivider,
  SettingsSectionHeading,
} from '@/components/modules/settings/settings-ui';
import type { SettingsState } from '@/components/modules/settings/hooks/use-settings-state';

type SettingsModulesTabProps = Pick<
  SettingsState,
  | 'isAdmin'
  | 'categories'
  | 'addCategory'
  | 'deleteCategory'
  | 'requestDelete'
  | 'budgetEnabled'
  | 'setBudgetEnabled'
  | 'savingsEnabled'
  | 'setSavingsEnabled'
  | 'debtsEnabled'
  | 'setDebtsEnabled'
  | 'utilitiesEnabled'
  | 'setUtilitiesEnabled'
  | 'metersEnabled'
  | 'setMetersEnabled'
  | 'businessEnabled'
  | 'setBusinessEnabled'
  | 'businessName'
  | 'setBusinessName'
  | 'shopifyImportEnabled'
  | 'setShopifyImportEnabled'
  | 'shopifyShopUrl'
  | 'setShopifyShopUrl'
  | 'shopifyAccessToken'
  | 'setShopifyAccessToken'
  | 'hasShopifyToken'
  | 'utilitySplitEnabled'
  | 'setUtilitySplitEnabled'
  | 'utilitySplitPartnerId'
  | 'setUtilitySplitPartnerId'
  | 'utilityPartners'
  | 'businessSettings'
  | 'setBusinessSettings'
  | 'utilityTemplates'
  | 'setUtilityTemplates'
  | 'savingsSettings'
  | 'setSavingsSettings'
  | 'debtsSettings'
  | 'setDebtsSettings'
  | 'metersSettings'
  | 'setMetersSettings'
  | 'isBudgetSaving'
  | 'isSavingsSaving'
  | 'isDebtsSaving'
  | 'isUtilitiesSaving'
  | 'isMetersSaving'
  | 'isBusinessSaving'
  | 'handleBudgetSave'
  | 'handleBusinessSave'
  | 'handleSavingsSave'
  | 'handleDebtsSave'
  | 'handleMetersSave'
  | 'handleUtilitiesSave'
  | 'newCat'
  | 'setNewCat'
>;

export function SettingsModulesTab({
  isAdmin,
  categories,
  addCategory,
  deleteCategory,
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
  handleBudgetSave,
  handleBusinessSave,
  handleSavingsSave,
  handleDebtsSave,
  handleMetersSave,
  handleUtilitiesSave,
  newCat,
  setNewCat,
}: SettingsModulesTabProps) {
  const { allowed: utilitySplitAllowed, promptUpgrade: promptUtilitySplitUpgrade } =
    useTierFeature('utility_split');
  const { allowed: shopifyAllowed, promptUpgrade: promptShopifyUpgrade } = useTierFeature('shopify_import');

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
            onToggle={() => setBudgetEnabled(!budgetEnabled)}
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
            onToggle={() => setSavingsEnabled(!savingsEnabled)}
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
            onToggle={() => setDebtsEnabled(!debtsEnabled)}
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
            onToggle={() => setUtilitiesEnabled(!utilitiesEnabled)}
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
              <TierFeatureGate feature="utility_split" featureLabel="Rezsi megosztás">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Rezsi megosztás</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Közös számlák elszámolása partnerekkel.</p>
                  </div>
                  <Switch
                    checked={utilitySplitEnabled}
                    onCheckedChange={(v) => {
                      if (!utilitySplitAllowed) {
                        promptUtilitySplitUpgrade('Rezsi megosztás');
                        return;
                      }
                      setUtilitySplitEnabled(v);
                    }}
                    aria-label="Rezsi megosztás"
                  />
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
                        disabled={!utilitySplitAllowed}
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
              </TierFeatureGate>
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
            onToggle={() => setMetersEnabled(!metersEnabled)}
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
            onToggle={() => setBusinessEnabled(!businessEnabled)}
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

            <TierFeatureGate feature="shopify_import" featureLabel="Shopify import">
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
                    onCheckedChange={(v) => {
                      if (!shopifyAllowed) {
                        promptShopifyUpgrade('Shopify import');
                        return;
                      }
                      setShopifyImportEnabled(v);
                    }}
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
                        disabled={!shopifyAllowed}
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
                          disabled={!shopifyAllowed}
                        />
                      </div>
                    </FormField>
                  </div>
                )}
              </div>
            </TierFeatureGate>

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
  );
}
