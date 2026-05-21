'use client';

import { Section, EmptyState } from '@/components/design';
import { Wallet } from 'lucide-react';
import type { SavingsPageState } from '@/components/modules/savings/hooks/use-savings-page-state';
import { SavingsAccountCard } from '@/components/modules/savings/savings-account-card';

type SavingsAccountsSectionProps = Pick<
  SavingsPageState,
  | 'personalSavings'
  | 'wifeSavings'
  | 'separateOwner'
  | 'convertToHUF'
  | 'formatCurrencyAmount'
  | 'updateSavingsAccount'
  | 'deleteSavingsAccount'
  | 'requestDelete'
  | 'openLedgerModal'
>;

export function SavingsAccountsSection({
  personalSavings,
  wifeSavings,
  separateOwner,
  ...cardProps
}: SavingsAccountsSectionProps) {
  return (
    <>
      <Section title="Saját és közös számlák" description={`${personalSavings.length} aktív számla`}>
        {personalSavings.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nincs saját vagy közös számla"
            description="Adj hozzá egy új számlát a jobb felső sarokban lévő „Új” gombbal."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {personalSavings.map((acc) => (
              <SavingsAccountCard key={acc.id} acc={acc} accent="primary" {...cardProps} />
            ))}
          </div>
        )}
      </Section>

      {separateOwner && wifeSavings.length > 0 && (
        <Section title={`${separateOwner} számlák`} description={`${wifeSavings.length} aktív számla`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wifeSavings.map((acc) => (
              <SavingsAccountCard key={acc.id} acc={acc} accent="rose" {...cardProps} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
