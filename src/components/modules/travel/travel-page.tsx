'use client';

import { PageHeader, EmptyState } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { TravelForm } from '@/components/modules/travel/components/travel-form';
import { TravelResult } from '@/components/modules/travel/components/travel-result';
import { useTravelLogic } from '@/components/modules/travel/hooks/useTravelLogic';
import { useAuthStore } from '@/stores/useAuthStore';
import { isPlatformFeatureEnabled } from '@/lib/platformFeatureFlags';
import { MapPinned } from 'lucide-react';

export function TravelPage() {
  const logic = useTravelLogic();
  const user = useAuthStore((s) => s.user);
  const enabled = isPlatformFeatureEnabled(user, 'enable_ai_travel_planner');

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
          <TravelForm
            destination={logic.destination}
            durationDays={logic.durationDays}
            totalBudget={logic.totalBudget}
            targetDate={logic.targetDate}
            isGenerating={logic.isGenerating}
            onDestinationChange={logic.setDestination}
            onDurationDaysChange={logic.setDurationDays}
            onTotalBudgetChange={logic.setTotalBudget}
            onTargetDateChange={logic.setTargetDate}
            onSubmit={logic.handleGeneratePlan}
          />

          {logic.plan ? (
            <TravelResult
              plan={logic.plan}
              isSavingGoal={logic.isSavingGoal}
              onSaveAsGoal={() => void logic.handleSaveAsGoal()}
            />
          ) : null}
        </div>
      </TierGatedAiPanel>
    </div>
  );
}
