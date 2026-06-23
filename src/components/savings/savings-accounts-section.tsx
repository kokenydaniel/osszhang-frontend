'use client';

import { formatHUF } from '@/utils';
import { Section, EmptyState } from '@/components/design';
import { Wallet } from 'lucide-react';
import type { SavingsAccount } from '@/types';
import { SavingsAccountCard } from './savings-account-card';

type SavingsAccountsSectionProps = {
  personalAccounts: SavingsAccount[];
  wifeAccounts: SavingsAccount[];
  separateOwner: string;
  sumDisplayPersonalAccounts: number;
  sumDisplayWifeAccounts: number;
  convertToHUF: (amount: number, currency: string) => number;
  formatCurrencyAmount: (amount: number, currency: string) => string;
  updateSavingsAccount: (id: number, partial: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => Promise<void>;
  deleteSavingsAccount: (id: number) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
  onOpenLedger: (accId: number) => void;
  isReader: boolean;
};

export function SavingsAccountsSection({
  personalAccounts,
  wifeAccounts,
  separateOwner,
  sumDisplayPersonalAccounts,
  sumDisplayWifeAccounts,
  ...cardProps
}: SavingsAccountsSectionProps) {
  return (
    <>
      <Section
        title="Számlák és vagyon"
        description={`${personalAccounts.length} aktív számla · ${formatHUF(sumDisplayPersonalAccounts)} össz érték`}
      >
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

      {separateOwner && wifeAccounts.length > 0 ? (
        <Section
          title={`${separateOwner} számlák`}
          description={`${wifeAccounts.length} aktív számla · ${formatHUF(sumDisplayWifeAccounts)} össz érték`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wifeAccounts.map((acc) => (
              <SavingsAccountCard key={acc.id} acc={acc} accent="rose" {...cardProps} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
