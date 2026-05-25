'use client';

import { Section, EmptyState } from '@/components/design';
import { Wallet } from 'lucide-react';
import type { SavingsPageState } from '@/components/modules/savings/hooks/use-savings-page-state';
import { SavingsAccountCard } from '@/components/modules/savings/savings-account-card';

type SavingsAccountsSectionProps = Pick<
  SavingsPageState,
  | 'personalAccounts'
  | 'wifeAccounts'
  | 'separateOwner'
  | 'convertToHUF'
  | 'formatCurrencyAmount'
  | 'updateSavingsAccount'
  | 'deleteSavingsAccount'
  | 'requestDelete'
  | 'openLedgerModal'
  | 'isReader'
>;

export function SavingsAccountsSection({
  personalAccounts,
  wifeAccounts,
  separateOwner,
  ...cardProps
}: SavingsAccountsSectionProps) {
  return (
    <>
      <Section title="Számlák és vagyon" description={`${personalAccounts.length} aktív számla`}>
        {personalAccounts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nincs számla vagy vagyon tétel"
            description="Adj hozzá egy bankszámlát, Revolutot vagy készpénzt a jobb felső „Új” gombbal."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {personalAccounts.map((acc) => (
              <SavingsAccountCard key={acc.id} acc={acc} accent="primary" {...cardProps} />
            ))}
          </div>
        )}
      </Section>

      {separateOwner && wifeAccounts.length > 0 && (
        <Section title={`${separateOwner} számlák`} description={`${wifeAccounts.length} aktív számla`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wifeAccounts.map((acc) => (
              <SavingsAccountCard key={acc.id} acc={acc} accent="rose" {...cardProps} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
