'use client';

import { formatHUF } from '@/utils';
import { Section, EmptyState } from '@/components/design';
import { Sparkles } from 'lucide-react';
import type { SavingsLogicResult } from '@/components/modules/savings/hooks/useSavingsLogic';
import type { SavingsUiContextValue } from '@/components/modules/savings/SavingsUiContext';
import { SavingsInvestmentCard } from '@/components/modules/savings/savings-investment-card';

type SavingsInvestmentsSectionProps = Pick<
  SavingsLogicResult & SavingsUiContextValue,
  | 'investments'
  | 'sumPersonalInvestments'
  | 'sumWifeInvestments'
  | 'getInvestmentValue'
  | 'getMaturityAmount'
  | 'updateInvestment'
  | 'deleteInvestment'
  | 'requestDelete'
  | 'editingInvId'
  | 'editingInvValue'
  | 'setEditingInvValue'
  | 'editingPayoutInvId'
  | 'setEditingPayoutInvId'
  | 'editingPayoutAmount'
  | 'setEditingPayoutAmount'
  | 'editingPayoutDate'
  | 'setEditingPayoutDate'
  | 'startEditInvestmentValue'
  | 'saveInvestmentValue'
  | 'cancelEditInvestmentValue'
  | 'saveInvestmentPayout'
  | 'isReader'
>;

export function SavingsInvestmentsSection({
  investments,
  sumPersonalInvestments,
  sumWifeInvestments,
  ...cardProps
}: SavingsInvestmentsSectionProps) {
  return (
    <Section
      title="Állampapírok és kincstári számlák"
      description={`${investments.length} aktív befektetés · ${formatHUF(
        sumPersonalInvestments + sumWifeInvestments,
      )} össz érték`}
    >
      {investments.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nincs befektetés"
          description="Adj hozzá állampapírt a jobb felső sarokban lévő „Új” gombbal (Állampapír fül)."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {investments.map((inv) => (
            <SavingsInvestmentCard key={inv.id} inv={inv} {...cardProps} />
          ))}
        </div>
      )}
    </Section>
  );
}
