'use client';

import { useEffect, useState } from 'react';
import { PageCollapsibleSection } from '@/components/design/page-collapsible-section';
import { canUseFeature } from '@/helpers/check-access';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { BudgetPaymentPriorityPanel } from './budget-payment-priority-panel';
import { BudgetAiOverspendBanner } from './budget-ai-overspend-banner';
import { BudgetCostReductionPanel } from './budget-cost-reduction-panel';
import type { AiOverspendAnalysis } from '@/types';

type Props = {
  year: number;
  month: number;
  walletId?: number | null;
  aiOverspend: AiOverspendAnalysis | null;
};

export function BudgetMonthInsightsSection({ year, month, walletId, aiOverspend }: Props) {
  const user = useAuthStore((s) => s.user);
  const canUseAi = canUseFeature(user, 'ai');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || walletId == null || !canUseAi) return;
    void useBudgetStore.getState().fetchAiInsights(walletId, year, month, canUseAi);
  }, [open, walletId, year, month, canUseAi]);

  return (
    <PageCollapsibleSection
      title="Elemzések és javaslatok"
      description="Fizetési sorrend, túlköltés és spórolás."
      badge="Opcionális"
      defaultOpen={false}
      open={open}
      onOpenChange={setOpen}
    >
      <BudgetPaymentPriorityPanel year={year} month={month} walletId={walletId} compact />
      <BudgetAiOverspendBanner aiOverspend={aiOverspend} compact />
      <BudgetCostReductionPanel year={year} month={month} walletId={walletId} compact enabled={open} />
    </PageCollapsibleSection>
  );
}
