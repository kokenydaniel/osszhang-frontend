'use client';

import { Section, EmptyState } from '@/components/design';
import { Target } from 'lucide-react';
import type { SavingsPageState } from '@/components/modules/savings/hooks/use-savings-page-state';
import { SavingsGoalCard } from '@/components/modules/savings/savings-goal-card';

type SavingsGoalsSectionProps = Pick<
  SavingsPageState,
  | 'goals'
  | 'updateSavingsAccount'
  | 'deleteSavingsAccount'
  | 'requestDelete'
  | 'openLedgerModal'
  | 'isReader'
  | 'selectedMonth'
  | 'selectedYear'
>;

export function SavingsGoalsSection({
  goals,
  ...cardProps
}: SavingsGoalsSectionProps) {
  return (
    <Section
      title="Megtakarítási célok"
      description={`${goals.length} aktív cél a kiválasztott kasszában`}
    >
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Még nincs megtakarítási cél"
          description="Adj hozzá egy új célt a jobb felső sarokban lévő „Új” gombbal."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <SavingsGoalCard key={goal.id} goal={goal} {...cardProps} />
          ))}
        </div>
      )}
    </Section>
  );
}
