'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence } from 'motion/react';
import { AsyncStepProgress, PageHeader, EmptyState } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { buildTravelGenerationSteps } from '@/config/travel-generation-steps';
import type { AsyncStepProgressStep } from '@/components/design/async-step-progress';
import { useTravelPageData, type TravelFormInput } from '@/hooks/useTravelPageData';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAuthStore } from '@/stores/useAuthStore';
import { canAccessModule, canUseModuleWithTier } from '@/helpers/module-access';
import { canEditHousehold } from '@/utils/household-role';
import type { AiMeta, AiTravelPlan } from '@/types';
import type { SavedTravelPlanRecord } from '@/types/travel';
import { Lock, MapPinned } from 'lucide-react';
import { TravelForm } from './travel-form';
import { TravelResult } from './travel-result';
import { TravelHistoryPanel } from './travel-history-panel';
import { TravelPageSkeleton } from './travel-page-skeleton';
import Link from 'next/link';

const defaultFormValues: TravelFormInput = {
  destination: '',
  originLocation: 'Budapest',
  durationDays: '5',
  totalBudget: '',
  targetDate: '',
  travelersCount: '2',
  tripStyle: 'mixed',
  accommodationPreference: 'mixed',
  transportMode: 'mixed',
  transportAlreadyBooked: false,
  accommodationAlreadyBooked: false,
  carFuelConsumption: '7',
};

export function TravelPage() {
  const user = useAuthStore((s) => s.user);
  const {
    generatePlan,
    saveAsGoal,
    deleteSavedPlan,
    savedPlans,
    historyLoading,
    initialLoaded,
  } = useTravelPageData();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const hasPermission = canUseModuleWithTier(user, 'travel_planner');
  const canSaveGoal =
    !!user && canEditHousehold(user) && canUseModuleWithTier(user, 'savings');

  const [plan, setPlan] = useState<AiTravelPlan | null>(null);
  const [planSessionKey, setPlanSessionKey] = useState(0);
  const latestAdjustedPlanRef = useRef<AiTravelPlan | null>(null);
  const [meta, setMeta] = useState<AiMeta | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressSession, setProgressSession] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<AsyncStepProgressStep[]>([]);

  const form = useForm<TravelFormInput>({ defaultValues: defaultFormValues });
  const targetDate = form.watch('targetDate');

  const handleGenerate = form.handleSubmit(async (values) => {
    setGenerationSteps(buildTravelGenerationSteps(values));
    setProgressSession((session) => session + 1);
    setProgressOpen(true);
    setIsGenerating(true);
    setPlan(null);
    setMeta(null);
    try {
      const next = await generatePlan(values);
      if (next) {
        setPlan(next.plan);
        setPlanSessionKey((key) => key + 1);
        setMeta(next.meta);
      }
    } finally {
      setIsGenerating(false);
    }
  });

  const handleSaveGoal = async () => {
    const currentPlan = latestAdjustedPlanRef.current ?? plan;
    if (!currentPlan || !canSaveGoal) return;
    setIsSavingGoal(true);
    try {
      await saveAsGoal(currentPlan, form.getValues('targetDate'));
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleLoadHistory = (record: SavedTravelPlanRecord) => {
    setPlan({ ...record.plan, saved_plan_id: record.id });
    setPlanSessionKey(record.id);
    setMeta(null);
    form.reset({
      destination: record.destination,
      originLocation: record.origin_location ?? 'Budapest',
      durationDays: String(record.duration_days),
      totalBudget: String(record.total_budget),
      targetDate: record.target_date ?? '',
      travelersCount: String(record.travelers_count),
      tripStyle: (record.trip_style as TravelFormInput['tripStyle']) ?? 'mixed',
      accommodationPreference:
        (record.accommodation_preference as TravelFormInput['accommodationPreference']) ?? 'mixed',
      transportMode: (record.transport_mode as TravelFormInput['transportMode']) ?? 'mixed',
      transportAlreadyBooked: record.transport_already_booked,
      accommodationAlreadyBooked: record.accommodation_already_booked ?? false,
      carFuelConsumption: record.car_fuel_consumption_l100 ? String(record.car_fuel_consumption_l100) : '7',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePlan = (record: SavedTravelPlanRecord) => {
    requestDelete({
      title: 'Utazási terv törlése',
      message: `Biztosan törlöd a „${record.destination}” tervet? Ez a művelet nem vonható vissza.`,
      confirmText: 'Törlés',
      onConfirm: async () => {
        const ok = await deleteSavedPlan(record.id);
        if (ok && plan?.saved_plan_id === record.id) {
          setPlan(null);
          setMeta(null);
        }
      },
    });
  };

  if (!hasPermission) {
    const noModuleAccess = user && !canAccessModule(user, 'travel_planner');

    return (
      <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
        <PageHeader
          breadcrumbs={[{ label: 'Okos eszközök' }, { label: 'Utazástervező' }]}
          title="AI Utazástervező"
          description="Reális költségvetés, közlekedés és napi program — a háztartás pénzügyeivel összehangolva."
        />
        <EmptyState
          icon={noModuleAccess ? Lock : MapPinned}
          title={noModuleAccess ? 'Hozzáférés megtagadva' : 'Nem elérhető'}
          description={
            noModuleAccess
              ? 'Az utazástervezőhöz nincs jogosultságod. Kérd meg a háztartás adminisztrátorát a Beállításokban.'
              : 'Az utazástervező modul nincs bekapcsolva, vagy a csomagod nem tartalmazza.'
          }
          action={
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              Vissza a vezérlőpultra
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Okos eszközök' }, { label: 'Utazástervező' }]}
        title="AI Utazástervező"
        description={
          canSaveGoal
            ? 'Reális utazási költség autóval, repülővel vagy vonattal — menthető megtakarítási célként.'
            : 'Reális utazási költségterv. Olvasó jogosultsággal a megtakarítási cél mentése nem elérhető.'
        }
      />

      <TierGatedAiPanel
        featureLabel="AI Utazástervező"
        icon={MapPinned}
        title="Prémium utazástervezés"
        description="Determinisztikus minimum árak + AI program. Nem 5 000 Ft-os repülő — valós üzemanyag, jegy, szállás."
        glow
      >
        <div className="flex flex-col gap-7">
          {!initialLoaded ? (
            <TravelPageSkeleton />
          ) : (
            <>
              <TravelHistoryPanel
                plans={savedPlans}
                loading={historyLoading}
                onLoad={handleLoadHistory}
                onDelete={handleDeletePlan}
              />

              <TravelForm form={form} isGenerating={isGenerating} onSubmit={handleGenerate} />

              <AnimatePresence>
                {progressOpen && generationSteps.length > 0 ? (
                  <AsyncStepProgress
                    key={progressSession}
                    steps={generationSteps}
                    running={isGenerating}
                    title="Utazási terv összeállítása"
                    onComplete={() => setProgressOpen(false)}
                  />
                ) : null}
              </AnimatePresence>

              {plan ? (
                <TravelResult
                  key={planSessionKey}
                  plan={plan}
                  formValues={form.getValues()}
                  targetDate={targetDate || null}
                  meta={meta}
                  canSaveGoal={canSaveGoal}
                  isSavingGoal={isSavingGoal}
                  onSaveAsGoal={() => void handleSaveGoal()}
                  onPlanChange={(adjusted) => {
                    latestAdjustedPlanRef.current = adjusted;
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </TierGatedAiPanel>

      <ConfirmDeleteModal />
    </div>
  );
}
