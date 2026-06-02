'use client';

import { Section, EmptyState } from '@/components/design';
import { Target } from 'lucide-react';
import type { SavingsAccount } from '@/types';
import { SavingsGoalCard } from './savings-goal-card';

type SavingsGoalsSectionProps = {
  goals: SavingsAccount[];
  updateSavingsAccount: (id: number, partial: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => Promise<void>;
  deleteSavingsAccount: (id: number) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
  onOpenLedger: (accId: number) => void;
  isReader: boolean;
  selectedMonth: number;
  selectedYear: number;
};

export function SavingsGoalsSection({ goals, ...cardProps }: SavingsGoalsSectionProps) {
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
