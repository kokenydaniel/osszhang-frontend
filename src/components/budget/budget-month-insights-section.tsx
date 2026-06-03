'use client';

import { PageCollapsibleSection } from '@/components/design/page-collapsible-section';
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
  return (
    <PageCollapsibleSection
      title="Elemzések és javaslatok"
      description="Fizetési sorrend, túlköltés és spórolás — alapból összecsukva, hogy hamarabb elérhesd a tételeket."
      badge="Opcionális"
      defaultOpen={false}
    >
      <BudgetPaymentPriorityPanel year={year} month={month} walletId={walletId} compact />
      <BudgetAiOverspendBanner aiOverspend={aiOverspend} compact />
      <BudgetCostReductionPanel year={year} month={month} walletId={walletId} compact />
    </PageCollapsibleSection>
  );
}
