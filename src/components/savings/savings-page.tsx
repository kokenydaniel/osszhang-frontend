'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip } from '@/components/design';
import { Plus } from 'lucide-react';
import { WalletSwitcherContainer as WalletSwitcher } from '@/components/layout/wallet-switcher-container';
import { useSavingsPageData } from '@/hooks/useSavingsPageData';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { canEditHousehold } from '@/utils/household-role';
import type { Investment } from '@/types';
import { NewAssetModal } from './new-asset-modal';
import { SavingsInvestmentEditModal } from './savings-investment-edit-modal';
import { SavingsAccountsSection } from './savings-accounts-section';
import { SavingsGoalsSection } from './savings-goals-section';
import { SavingsInvestmentsSection } from './savings-investments-section';
import { SavingsLedgerModal } from './savings-ledger-modal';
import { SavingsPageSkeleton } from './savings-page-skeleton';

type AssetKind = 'account' | 'goal' | 'investment';

export function SavingsPage() {
  const data = useSavingsPageData();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: assetSaving, run: runAssetSave } = useAsyncAction();

  const [newAssetOpen, setNewAssetOpen] = useState(false);
  const [newAssetKind, setNewAssetKind] = useState<AssetKind>('account');
  const [ledgerAccountId, setLedgerAccountId] = useState<number | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const ledgerAccount = ledgerAccountId !== null ? data.getAccountById(ledgerAccountId) : null;
  const pageReady = data.activeWalletId !== null && !data.loading;

  const openNewAsset = (kind: AssetKind = 'account') => {
    if (!canEditHousehold(data.user)) return;
    setNewAssetKind(kind);
    setNewAssetOpen(true);
  };

  const accountCardProps = {
    convertToHUF: data.convertToHUF,
    formatCurrencyAmount: data.formatCurrencyAmount,
    updateSavingsAccount: data.updateSavingsAccount,
    deleteSavingsAccount: async (id: number) => {
      try {
        await data.deleteSavingsAccount(id);
        addNotification('Számla törölve.', 'success');
      } catch {
        addNotification('A törlés nem sikerült.', 'error');
      }
    },
    requestDelete,
    onOpenLedger: setLedgerAccountId,
    isReader: data.isReader,
  };

  const goalCardProps = {
    updateSavingsAccount: data.updateSavingsAccount,
    deleteSavingsAccount: accountCardProps.deleteSavingsAccount,
    requestDelete,
    onOpenLedger: setLedgerAccountId,
    isReader: data.isReader,
    selectedMonth: data.selectedMonth,
    selectedYear: data.selectedYear,
  };

  const investmentCardProps = {
    getInvestmentValue: data.getInvestmentValue,
    updateInvestment: data.updateInvestment,
    deleteInvestment: async (id: number) => {
      try {
        await data.deleteInvestment(id);
        addNotification('Befektetés törölve.', 'success');
      } catch {
        addNotification('A törlés nem sikerült.', 'error');
      }
    },
    requestDelete,
    onEditInvestment: (inv: Investment) => setEditingInvestment(inv),
    isReader: data.isReader,
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Megtakarítások' }, { label: 'Széf' }]}
        title="Megtakarítások · Széf"
        description="Számlák, megtakarítási célok és vagyon — kasszánként."
        meta={<WalletSwitcher />}
        actions={
          !data.isReader ? (
            <Button size="sm" onClick={() => openNewAsset()}>
              <Plus size={13} /> Új
            </Button>
          ) : undefined
        }
      />

      {!pageReady ? (
        <SavingsPageSkeleton />
      ) : (
        <>
          <MetricStrip items={data.savingsMetrics} columns={4} variant="separated" />
          <SavingsAccountsSection
            personalAccounts={data.personalAccounts}
            wifeAccounts={data.wifeAccounts}
            separateOwner={data.separateOwner}
            sumDisplayPersonalAccounts={data.sumDisplayPersonalAccounts}
            sumDisplayWifeAccounts={data.sumDisplayWifeAccounts}
            {...accountCardProps}
          />
          <SavingsGoalsSection goals={data.goals} sumDisplayGoals={data.sumDisplayGoals} {...goalCardProps} />
          <SavingsInvestmentsSection
            investments={data.investments}
            sumDisplayAllInvestments={data.sumDisplayAllInvestments}
            {...investmentCardProps}
          />
        </>
      )}

      <SavingsInvestmentEditModal
        investment={editingInvestment}
        savingsSettings={data.savingsSettings}
        onClose={() => setEditingInvestment(null)}
        saving={assetSaving}
        onSave={async (id, payload) => {
          await runAssetSave(async () => {
            await data.updateInvestment(id, payload);
            addNotification('Befektetés frissítve.', 'success');
            setEditingInvestment(null);
          });
        }}
      />

      <NewAssetModal
        isOpen={newAssetOpen}
        onClose={() => setNewAssetOpen(false)}
        initialKind={newAssetKind}
        savingsSettings={data.savingsSettings}
        saving={assetSaving}
        onAddSavingsAccount={async (payload) => {
          await runAssetSave(async () => {
            await data.addSavingsAccount({ ...payload, walletId: data.activeWalletId });
            addNotification(payload.type === 'goal' ? 'Cél létrehozva.' : 'Számla létrehozva.', 'success');
          });
        }}
        onAddInvestment={async (inv) => {
          await runAssetSave(async () => {
            await data.addInvestment(inv);
            addNotification('Befektetés létrehozva.', 'success');
          });
        }}
      />

      <SavingsLedgerModal
        open={ledgerAccountId !== null}
        account={ledgerAccount}
        isReader={data.isReader}
        formatCurrencyAmount={data.formatCurrencyAmount}
        onClose={() => setLedgerAccountId(null)}
        onSave={async (savingsId, entry, editingId) => {
          try {
            await data.saveLedgerEntry(savingsId, entry, editingId);
            addNotification(editingId ? 'Mozgás frissítve.' : 'Mozgás rögzítve.', 'success');
          } catch {
            addNotification('A mentés nem sikerült.', 'error');
            throw new Error();
          }
        }}
        onDeleteEntry={async (savingsId, entryId) => {
          try {
            await data.deleteLedgerEntry(savingsId, entryId);
            addNotification('Mozgás törölve.', 'success');
          } catch {
            addNotification('A törlés nem sikerült.', 'error');
          }
        }}
        requestDelete={requestDelete}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
