'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, EmptyState } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { useTravelPageData, type TravelFormInput } from '@/hooks/useTravelPageData';
import { useAuthStore } from '@/stores/useAuthStore';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import type { AiTravelPlan } from '@/types';
import { MapPinned } from 'lucide-react';
import { TravelForm } from './travel-form';
import { TravelResult } from './travel-result';

const defaultFormValues: TravelFormInput = {
  destination: '',
  durationDays: '5',
  totalBudget: '',
  targetDate: '',
};

export function TravelPage() {
  const user = useAuthStore((s) => s.user);
  const { generatePlan, saveAsGoal } = useTravelPageData();
  const enabled = isPlatformFeatureEnabled(user, 'enable_ai_travel_planner');

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
    if (!plan) return;
    setIsSavingGoal(true);
    try {
      await saveAsGoal(plan, form.getValues('targetDate'));
    } finally {
      setIsSavingGoal(false);
    }
  };

  if (!enabled) {
    return (
      <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
        <PageHeader
          breadcrumbs={[{ label: 'Okos eszközök' }, { label: 'Utazástervező' }]}
          title="AI Utazástervező"
          description="Költségvetés, útvonal és szállás — intelligens tervezéssel."
        />
        <EmptyState
          icon={MapPinned}
          title="Nem elérhető"
          description="Az AI utazástervező jelenleg nem aktív a platformon."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Okos eszközök' }, { label: 'Utazástervező' }]}
        title="AI Utazástervező"
        description="Tervezd meg az utazásodat költségvetéssel — majd mentsd el megtakarítási célként."
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
            <TravelResult plan={plan} isSavingGoal={isSavingGoal} onSaveAsGoal={() => void handleSaveGoal()} />
          ) : null}
        </div>
      </TierGatedAiPanel>
    </div>
  );
}
