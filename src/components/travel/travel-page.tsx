'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, EmptyState } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { useTravelPageData, type TravelFormInput } from '@/hooks/useTravelPageData';
import { useAuthStore } from '@/stores/useAuthStore';
import { canAccessModule, canUseModuleWithTier } from '@/helpers/module-access';
import { canEditHousehold } from '@/utils/household-role';
import type { AiTravelPlan } from '@/types';
import { Lock, MapPinned } from 'lucide-react';
import { TravelForm } from './travel-form';
import { TravelResult } from './travel-result';
import Link from 'next/link';

const defaultFormValues: TravelFormInput = {
  destination: '',
  durationDays: '5',
  totalBudget: '',
  targetDate: '',
};

export function TravelPage() {
  const user = useAuthStore((s) => s.user);
  const { generatePlan, saveAsGoal } = useTravelPageData();
  const hasPermission = canUseModuleWithTier(user, 'travel_planner');
  const canSaveGoal =
    !!user && canEditHousehold(user) && canUseModuleWithTier(user, 'savings');

  const [plan, setPlan] = useState<AiTravelPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const form = useForm<TravelFormInput>({ defaultValues: defaultFormValues });

  const handleGenerate = form.handleSubmit(async (values) => {
    setIsGenerating(true);
    setPlan(null);
    try {
      const next = await generatePlan(values);
      if (next) setPlan(next);
    } finally {
      setIsGenerating(false);
    }
  });

  const handleSaveGoal = async () => {
    if (!plan || !canSaveGoal) return;
    setIsSavingGoal(true);
    try {
      await saveAsGoal(plan, form.getValues('targetDate'));
    } finally {
      setIsSavingGoal(false);
    }
  };

  if (!hasPermission) {
    const noModuleAccess = user && !canAccessModule(user, 'travel_planner');

    return (
      <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
        <PageHeader
          breadcrumbs={[{ label: 'Okos eszközök' }, { label: 'Utazástervező' }]}
          title="AI Utazástervező"
          description="Költségvetés, útvonal és szállás — intelligens tervezéssel."
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
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:underline"
            >
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
            ? 'Tervezd meg az utazásodat költségvetéssel — majd mentsd el megtakarítási célként.'
            : 'Tervezd meg az utazásodat költségvetéssel. Olvasó jogosultsággal a terv nem menthető megtakarításba.'
        }
      />

      <TierGatedAiPanel
        featureLabel="AI Utazástervező"
        icon={MapPinned}
        title="Okos utazástervezés"
        description="Az AI napi programot és költségbontást készít a megadott kerethez igazítva."
        glow
      >
        <div className="flex flex-col gap-7">
          <TravelForm form={form} isGenerating={isGenerating} onSubmit={handleGenerate} />

          {plan ? (
            <TravelResult
              plan={plan}
              canSaveGoal={canSaveGoal}
              isSavingGoal={isSavingGoal}
              onSaveAsGoal={() => void handleSaveGoal()}
            />
          ) : null}
        </div>
      </TierGatedAiPanel>
    </div>
  );
}
