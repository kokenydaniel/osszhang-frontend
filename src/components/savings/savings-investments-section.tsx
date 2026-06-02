'use client';

import { formatHUF } from '@/utils';
import { Section, EmptyState } from '@/components/design';
import { Sparkles } from 'lucide-react';
import type { Investment } from '@/types';
import { SavingsInvestmentCard } from './savings-investment-card';

type SavingsInvestmentsSectionProps = {
  investments: Investment[];
  sumPersonalInvestments: number;
  sumWifeInvestments: number;
  getInvestmentValue: (inv: Investment) => {
    totalValue: number;
    accruedInterest: number;
    daysPassed: number;
  };
  getMaturityAmount: (inv: Investment) => number | null;
  updateInvestment: (id: number, data: Partial<Omit<Investment, 'id'>>) => Promise<void>;
  deleteInvestment: (id: number) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
  onEditInvestment?: (inv: Investment) => void;
  isReader: boolean;
};

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
            <SavingsInvestmentCard
              key={inv.id}
              inv={inv}
              {...cardProps}
              onEditDetails={cardProps.onEditInvestment}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
