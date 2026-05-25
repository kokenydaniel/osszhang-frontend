'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Command,
  Gauge,
  Home,
  PiggyBank,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  Wallet,
  Droplets,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/FormField';
import classNames from 'classnames';
import { APP_NAME } from '@/lib/branding';
import { useAuthStore } from '@/stores/useAuthStore';
import { useInitStore } from '@/stores/useInit';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import {
  ONBOARDING_CATEGORY_PRESETS,
  ONBOARDING_MODULE_OPTIONS,
  financialModelLabel,
  financialModelNeedsPrivateWallet,
  type FinancialModelId,
  type OnboardingModuleId,
} from '@/lib/householdOnboarding';
import {
  buildCategoriesFromAnswers,
  countAnsweredQuestions,
  DEFAULT_PERSONALIZATION_ANSWERS,
  HOUSEHOLD_VIBE_PRESETS,
  mergeCategoryList,
  ONBOARDING_BASE_CATEGORIES,
  recommendedModuleIds,
  type PersonalizationAnswer,
  type PersonalizationAnswers,
  type PersonalizationQuestionId,
} from '@/lib/onboardingPersonalization';
import { OnboardingPersonalizationStep } from '@/components/onboarding/OnboardingPersonalizationStep';
import { OnboardingFinancialModelStep } from '@/components/onboarding/OnboardingFinancialModelStep';
import { HOUSEHOLD_VIBE_ICONS } from '@/lib/onboardingIcons';
import { formatGivenName } from '@/lib/personName';
import { TierBadge } from '@/components/subscription/TierBadge';
import { tierForOnboardingFeature } from '@/lib/householdOnboarding';
import { buildOnboardingSavingsSettings } from '@/lib/savingsSettings';
import { ApiClientError } from '@/lib/api-client/api-client';
import { walletClient } from '@/lib/api-client';
import { openUpgradeModal } from '@/stores/useUpgradeModalStore';

const STEP_TITLES = ['Üdvözlünk', 'Pénzügyi modell', 'Rólatok', 'Modulok', 'Részletek', 'Indítás'];

const MODULE_ICONS: Record<OnboardingModuleId, React.ComponentType<{ size?: number; className?: string }>> = {
  budget: Wallet,
  savings: PiggyBank,
  debts: TrendingDown,
  utilities: Droplets,
  meters: Gauge,
  business: ShoppingBag,
};

type ModuleSelection = Record<OnboardingModuleId, boolean>;

export function HouseholdOnboardingWizard() {
  const { user, updateHouseholdSettings } = useAuthStore();
  const { initialize } = useInitStore();
  const { addNotification } = useNotificationStore();
  const { setCategories } = useBudgetStore();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [financialModel, setFinancialModel] = useState<FinancialModelId | null>(null);

  const [householdName, setHouseholdName] = useState(user?.household?.name ?? '');
  const [modules, setModules] = useState<ModuleSelection>({
    budget: true,
    savings: false,
    debts: false,
    utilities: false,
    meters: false,
    business: false,
  });
  const [personalization, setPersonalization] = useState<PersonalizationAnswers>(
    () => ({ ...DEFAULT_PERSONALIZATION_ANSWERS }),
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => [...ONBOARDING_BASE_CATEGORIES]);
  const [utilitySplit, setUtilitySplit] = useState(false);
  const [savingsSeparateGroup, setSavingsSeparateGroup] = useState(false);
  const [savingsSeparateName, setSavingsSeparateName] = useState('');
  const [businessName, setBusinessName] = useState('');

  const personalizedCategories = useMemo(
    () => buildCategoriesFromAnswers(personalization),
    [personalization],
  );

  const suggestedModules = useMemo(
    () => recommendedModuleIds(personalization),
    [personalization],
  );

  const enabledModules = useMemo(
    () => ONBOARDING_MODULE_OPTIONS.filter((m) => modules[m.id]),
    [modules],
  );

  const answeredCount = countAnsweredQuestions(personalization);

  const finalCategoryPreview = useMemo(
    () =>
      mergeCategoryList(
        selectedCategories,
        buildCategoriesFromAnswers(personalization),
        modules.business ? ['Vállalkozás'] : [],
      ),
    [selectedCategories, personalization, modules.business],
  );

  const toggleModule = (id: OnboardingModuleId) => {
    if (id === 'budget') return;
    setModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const index = prev.findIndex((c) => c.toLowerCase() === cat.toLowerCase());
      if (index >= 0) return prev.filter((_, i) => i !== index);
      return [...prev, cat];
    });
  };

  const updatePersonalization = (id: PersonalizationQuestionId, answer: PersonalizationAnswer) => {
    setPersonalization((prev) => {
      const next = { ...prev, [id]: answer };
      const suggested = recommendedModuleIds(next);
      if (suggested.length > 0) {
        setModules((mods) => {
          const updated = { ...mods };
          for (const modId of suggested) {
            updated[modId] = true;
          }
          return updated;
        });
      }
      return next;
    });
  };

  const applyPersonalizationToCategories = () => {
    setSelectedCategories((prev) =>
      mergeCategoryList(ONBOARDING_BASE_CATEGORIES, buildCategoriesFromAnswers(personalization), prev),
    );
  };

  const applyAllSuggestedModules = () => {
    setModules((prev) => {
      const next = { ...prev };
      for (const id of suggestedModules) {
        next[id] = true;
      }
      return next;
    });
  };

  const canNext = () => {
    if (step === 0) return householdName.trim().length > 0 && selectedVibe !== null;
    if (step === 1) return financialModel !== null;
    if (step === 2) return answeredCount >= 3;
    if (step === 3) return modules.budget;
    if (step === 4) {
      if (modules.savings && savingsSeparateGroup && !savingsSeparateName.trim()) return false;
      if (modules.business && !businessName.trim()) return false;
      return true;
    }
    if (step === 5 && modules.business && !businessName.trim()) return false;
    return true;
  };

  const goNext = () => {
    if (step === 2) {
      applyPersonalizationToCategories();
    }
    if (step === 3 && modules.business) {
      setSelectedCategories((prev) => mergeCategoryList(prev, ['Vállalkozás']));
    }
    setStep((s) => s + 1);
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      const name = householdName.trim() || user?.household?.name || 'Háztartás';

      await updateHouseholdSettings({
        name,
        onboarding_completed: true,
      });

      setSkipModalOpen(false);
      await initialize();
      addNotification(
        'Az első beállítást később is befejezheted a Beállítások → Háztartás menüpontban.',
        'info',
      );
    } catch {
      addNotification('A művelet nem sikerült. Próbáld újra.', 'error');
      throw new Error('skip failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const finalCategories = mergeCategoryList(
        selectedCategories,
        buildCategoriesFromAnswers(personalization),
        modules.business ? ['Vállalkozás'] : [],
      );

      const payload: Parameters<typeof updateHouseholdSettings>[0] = {
        name: householdName.trim(),
        onboarding_completed: true,
        budget_enabled: modules.budget,
        savings_enabled: modules.savings,
        debts_enabled: modules.debts,
        utilities_enabled: modules.utilities,
        meters_enabled: modules.meters,
        business_enabled: modules.business,
        utility_split_enabled: modules.utilities ? utilitySplit : false,
      };

      if (modules.savings) {
        payload.savings_settings = buildOnboardingSavingsSettings(
          savingsSeparateGroup ? savingsSeparateName : undefined,
        );
      }

      if (modules.business) {
        if (!businessName.trim()) {
          addNotification('A vállalkozás megjelenő neve kötelező, ha a modul be van kapcsolva.', 'error');
          setSaving(false);
          return;
        }
        payload.business_name = businessName.trim();
      }

      await updateHouseholdSettings(payload);

      if (modules.budget && finalCategories.length > 0) {
        const { householdClient } = await import('@/lib/api-client');
        await householdClient.updateCategories(finalCategories);
        setCategories(finalCategories);
      }

      await useAuthStore.getState().fetchMe();

      let privateWalletPendingUpgrade = false;

      if (financialModel && financialModelNeedsPrivateWallet(financialModel)) {
        try {
          const res = await walletClient.create(
            { name: 'Saját privát kasszám', isShared: false },
            { silent: true },
          );
          const { mapWalletFromApi } = await import('@/lib/mapWallet');
          const { useWalletStore } = await import('@/stores/useWalletStore');
          const created = mapWalletFromApi(res.data);
          await useAuthStore.getState().fetchMe();
          useWalletStore.getState().setActiveWalletId(created.id);
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 403) {
            privateWalletPendingUpgrade = true;
            openUpgradeModal({
              requiredTier: 'pro',
              featureLabel: 'A privát kasszád beállításához válts Pro csomagra!',
            });
          } else {
            throw error;
          }
        }
      }

      await initialize();

      if (privateWalletPendingUpgrade) {
        addNotification(
          'A háztartás kész — a közös kassza már használható. A privát kasszához Pro csomag kell.',
          'info',
        );
      } else {
        addNotification('A háztartás beállítva — jó munkát!', 'success');
      }
    } catch {
      addNotification('A beállítás mentése nem sikerült. Próbáld újra.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const firstName = formatGivenName(user?.firstName) || 'Admin';
  const activeVibe = HOUSEHOLD_VIBE_PRESETS.find((v) => v.id === selectedVibe);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-background/75 backdrop-blur-[20px] saturate-150"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-2xl flex flex-col max-h-[min(92dvh,880px)] rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-primary/10 overflow-hidden">
        <div className="shrink-0 border-b border-border bg-gradient-to-br from-primary/[0.08] via-card to-card px-6 py-5 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            disabled={saving}
            aria-label="Beállítás későbbre halasztása"
            onClick={() => setSkipModalOpen(true)}
          >
            <X size={16} />
          </Button>

          <div className="flex items-start gap-3 pr-10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Command size={20} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                Első beállítás · {step + 1} / {STEP_TITLES.length}
              </p>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mt-0.5">
                {STEP_TITLES[step]}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {step === 0 && 'Kezdjük a nevetekkel — aztán pár játékos kérdés következik.'}
                {step === 1 && 'Válasszátok ki, hogyan kezelitek együtt a pénzügyeket — ehhez igazítjuk a kasszákat.'}
                {step === 2 && 'Egyesével jönnek a kérdések — a válaszaidból épül a költségvetés.'}
                {step === 3 && 'A válaszaid alapján ajánlott modulokat is kiemeltük.'}
                {step === 4 && 'Utolsó simítások — kategóriák és modul-specifikus beállítások.'}
                {step === 5 && 'Minden kész — indulhat a háztartás!'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-4">
            {STEP_TITLES.map((_, i) => (
              <div
                key={i}
                className={classNames(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= step ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              {step === 0 && (
                <>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex gap-3">
                    <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground leading-relaxed">
                      Szia, <strong>{firstName}</strong>! Mesélj egy kicsit magatokról — az {APP_NAME} ez alapján
                      személyre szabja a kategóriákat és modulokat.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Milyen háztartás vagytok?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Segít a név javaslatában — a következő lépésben finomíthatod a részleteket.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {HOUSEHOLD_VIBE_PRESETS.map((vibe) => {
                        const VibeIcon = HOUSEHOLD_VIBE_ICONS[vibe.id];
                        return (
                          <motion.button
                            key={vibe.id}
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedVibe(vibe.id);
                              if (!householdName.trim()) {
                                setHouseholdName(vibe.nameHint.replace('Pl. ', ''));
                              }
                            }}
                            className={classNames(
                              'flex items-start gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors',
                              selectedVibe === vibe.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/20',
                            )}
                          >
                            <div
                              className={classNames(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                selectedVibe === vibe.id
                                  ? 'bg-primary/15 text-primary'
                                  : 'bg-muted text-muted-foreground',
                              )}
                            >
                              <VibeIcon size={18} strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-foreground block">{vibe.label}</span>
                              <span
                                className={classNames(
                                  'text-[0.7rem] leading-snug mt-0.5 block',
                                  selectedVibe === vibe.id ? 'text-primary/90' : 'text-muted-foreground',
                                )}
                              >
                                {vibe.description}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <FormField label="Háztartás neve">
                    <Input
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      placeholder={activeVibe?.nameHint ?? 'Pl. Kovács család'}
                      autoFocus
                    />
                  </FormField>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={15} />
                    <span>Később meghívhatsz családtagokat a Beállításokban.</span>
                  </div>
                </>
              )}

              {step === 1 && (
                <OnboardingFinancialModelStep value={financialModel} onChange={setFinancialModel} />
              )}

              {step === 2 && (
                <OnboardingPersonalizationStep
                  householdName={householdName}
                  answers={personalization}
                  onChange={updatePersonalization}
                  minAnswered={3}
                />
              )}

              {step === 3 && (
                <>
                  {suggestedModules.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <Wand2 size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground leading-relaxed">
                          <strong>{suggestedModules.length} modult</strong> ajánlunk a válaszaid alapján — be is
                          kapcsoltuk őket, de bármelyiket kikapcsolhatod.
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={applyAllSuggestedModules}>
                        Összes ajánlott
                      </Button>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ONBOARDING_MODULE_OPTIONS.map((mod) => {
                      const Icon = MODULE_ICONS[mod.id];
                      const active = modules[mod.id];
                      const locked = mod.id === 'budget';
                      const recommended = suggestedModules.includes(mod.id);
                      return (
                        <motion.button
                          key={mod.id}
                          type="button"
                          disabled={locked}
                          whileTap={locked ? undefined : { scale: 0.98 }}
                          onClick={() => toggleModule(mod.id)}
                          className={classNames(
                            'flex flex-col gap-2 rounded-xl border p-4 text-left transition-all',
                            active
                              ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/15'
                              : 'border-border bg-muted/20 hover:border-border hover:bg-muted/40',
                            recommended && active && 'shadow-sm shadow-amber-500/10',
                            locked && 'cursor-default opacity-95',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={classNames(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                              )}
                            >
                              <Icon size={18} />
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {mod.tier && <TierBadge tier={mod.tier} />}
                              {recommended && (
                                <span className="text-[0.55rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                  Ajánlott
                                </span>
                              )}
                              <span
                                className={classNames(
                                  'text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap',
                                  active
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground',
                                )}
                              >
                                {active ? 'Be' : 'Ki'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{mod.label}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.description}</p>
                            {locked && (
                              <p className="text-[0.65rem] text-primary mt-2 font-medium">Alapmodul — mindig bekapcsolva</p>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  {modules.budget && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Költségvetés kategóriák</h3>
                      <p className="text-xs text-muted-foreground">
                        A csillag ikonnal jelölt címkék a válaszaidból készültek — koppints, ha ki- vagy bekapcsolnád őket.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {mergeCategoryList(
                          ONBOARDING_BASE_CATEGORIES,
                          ONBOARDING_CATEGORY_PRESETS,
                          personalizedCategories,
                          selectedCategories,
                        ).map((cat) => {
                          const active = selectedCategories.some(
                            (c) => c.toLowerCase() === cat.toLowerCase(),
                          );
                          const fromPersonalization = personalizedCategories.some(
                            (c) => c.toLowerCase() === cat.toLowerCase(),
                          );
                          return (
                            <motion.button
                              key={cat}
                              type="button"
                              layout
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleCategory(cat)}
                              className={classNames(
                                'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                active
                                  ? 'border-primary/40 bg-primary/10 text-primary'
                                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                              )}
                            >
                              {fromPersonalization && active && <Sparkles size={11} className="shrink-0" />}
                              {cat}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {modules.utilities && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">Rezsi megosztás</p>
                          <TierBadge tier={tierForOnboardingFeature('utility_split')} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Közös számlák elszámolása partnerekkel (partnert később állíthatod be).
                        </p>
                      </div>
                      <Switch checked={utilitySplit} onCheckedChange={setUtilitySplit} aria-label="Rezsi megosztás" />
                    </div>
                  )}

                  {modules.savings && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Külön megtakarítási csoport</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Pl. utazás vagy egy személy külön szekcióban jelenik meg.
                          </p>
                        </div>
                        <Switch
                          checked={savingsSeparateGroup}
                          onCheckedChange={setSavingsSeparateGroup}
                          aria-label="Külön csoport"
                        />
                      </div>
                      {savingsSeparateGroup && (
                        <FormField label="Csoport neve">
                          <Input
                            value={savingsSeparateName}
                            onChange={(e) => setSavingsSeparateName(e.target.value)}
                            placeholder="pl. utazás alap"
                          />
                        </FormField>
                      )}
                    </div>
                  )}

                  {modules.business && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Shopify import</span>
                        <TierBadge tier={tierForOnboardingFeature('shopify')} />
                      </div>
                      <FormField label="Vállalkozás megjelenő neve">
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Pl. webshop neve — a menüben és a modulban így jelenik meg"
                      />
                    </FormField>
                    </div>
                  )}

                  {!modules.budget && !modules.utilities && !modules.savings && !modules.business && (
                    <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-4 py-3">
                      A kiválasztott modulokhoz nincs extra kérdés — mehetsz tovább az összegzéshez.
                    </p>
                  )}
                </>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-card p-4 space-y-4"
                  >
                    {[
                      {
                        delay: 0.05,
                        label: 'Háztartás',
                        value: householdName.trim(),
                        icon: Home,
                      },
                      {
                        delay: 0.1,
                        label: 'Pénzügyi modell',
                        value: financialModel ? financialModelLabel(financialModel) : '—',
                        icon: Wallet,
                      },
                      {
                        delay: 0.15,
                        label: 'Modulok',
                        value: `${enabledModules.length} bekapcsolva`,
                        icon: Sparkles,
                      },
                      {
                        delay: 0.25,
                        label: 'Kategóriák',
                        value: modules.budget ? `${finalCategoryPreview.length} db` : '—',
                        icon: Check,
                      },
                    ].map((row) => (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: row.delay, duration: 0.35 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <row.icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                            {row.label}
                          </p>
                          <p className="text-sm font-semibold text-foreground truncate">{row.value}</p>
                        </div>
                        <Check size={16} className="text-primary shrink-0" />
                      </motion.div>
                    ))}

                    {modules.budget && finalCategoryPreview.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="pt-2 border-t border-border/60"
                      >
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Kategória előnézet
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {finalCategoryPreview.map((cat, i) => (
                            <motion.span
                              key={cat}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 + i * 0.03 }}
                              className="rounded-md border border-border bg-card px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground"
                            >
                              {cat}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-muted-foreground leading-relaxed text-center"
                  >
                    Készen álltok — a háztartás a válaszaitoknak megfelelően épül fel.
                  </motion.p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="shrink-0 border-t border-border bg-muted/20 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || saving}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft size={14} />
              Vissza
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              disabled={saving}
              onClick={() => setSkipModalOpen(true)}
            >
              Később beállítom
            </Button>
          </div>
          {step < STEP_TITLES.length - 1 ? (
            <Button type="button" disabled={!canNext() || saving} onClick={goNext}>
              Tovább
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button type="button" loading={saving} disabled={saving || !canNext()} onClick={() => void handleFinish()}>
              <Sparkles size={14} />
              Háztartás indítása
            </Button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={skipModalOpen}
        onClose={() => !saving && setSkipModalOpen(false)}
        onConfirm={handleSkip}
        title="Beállítás későbbre halasztása?"
        message="Az alap funkciók azonnal használhatók lesznek. A modulokat, kategóriákat és egyéb részleteket később is beállíthatod a Beállításokban."
        confirmText="Igen, később"
        cancelText="Folytatom a varázslót"
        type="info"
        overlayZIndex={700}
        confirmLoading={saving}
      />
    </div>
  );
}
