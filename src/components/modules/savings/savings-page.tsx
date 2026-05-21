'use client';

import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip } from '@/components/design';
import { Plus } from 'lucide-react';
import { NewAssetModal } from '@/components/modules/savings/NewAssetModal';
import { useSavingsPageState } from '@/components/modules/savings/hooks/use-savings-page-state';
import { SavingsAccountsSection } from '@/components/modules/savings/savings-accounts-section';
import { SavingsInvestmentsSection } from '@/components/modules/savings/savings-investments-section';
import { SavingsLedgerModal } from '@/components/modules/savings/savings-ledger-modal';

export default function SavingsPage() {
  const state = useSavingsPageState();
  const { ConfirmDeleteModal } = state;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Megtakarítások' }, { label: 'Széf' }]}
        title="Megtakarítások · Széf"
        description="Számlák, állampapírok és vagyon — egy nézetben."
        actions={
          <Button size="sm" onClick={() => state.openNewAsset()}>
            <Plus size={13} /> Új
          </Button>
        }
      />

      <MetricStrip items={state.savingsMetrics} columns={4} variant="separated" />

      <SavingsAccountsSection {...state} />

      <SavingsInvestmentsSection {...state} />

      <NewAssetModal
        isOpen={state.isNewAssetModalOpen}
        onClose={() => state.setIsNewAssetModalOpen(false)}
        initialKind={state.newAssetInitialKind}
      />

      <SavingsLedgerModal {...state} />

      <ConfirmDeleteModal />
    </div>
  );
}
