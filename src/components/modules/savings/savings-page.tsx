'use client';

import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip } from '@/components/design';
import { Plus } from 'lucide-react';
import { NewAssetModal } from '@/components/modules/savings/NewAssetModal';
import { useSavingsLogic } from '@/components/modules/savings/hooks/useSavingsLogic';
import { useSavingsUi } from '@/components/modules/savings/SavingsUiContext';
import { SavingsAccountsSection } from '@/components/modules/savings/savings-accounts-section';
import { SavingsGoalsSection } from '@/components/modules/savings/savings-goals-section';
import { SavingsInvestmentsSection } from '@/components/modules/savings/savings-investments-section';
import { SavingsLedgerModal } from '@/components/modules/savings/savings-ledger-modal';
import { SavingsPageSkeleton } from '@/components/modules/savings/savings-page-skeleton';
import { WalletSwitcher } from '@/components/wallets/WalletSwitcher';

/**
 * SavingsPage — top-level Smart component for the Savings module.
 *
 * Reads all orchestrated data from useSavingsLogic and UI state from
 * useSavingsUi, then delegates rendering to pure Presenter components.
 * Must be rendered inside a <SavingsUiProvider>.
 */
export default function SavingsPage() {
  const logic = useSavingsLogic();
  const ui = useSavingsUi();
  const { ConfirmDeleteModal } = logic;

  const accountsSectionProps = {
    personalAccounts: logic.personalAccounts,
    wifeAccounts: logic.wifeAccounts,
    separateOwner: logic.separateOwner,
    convertToHUF: logic.convertToHUF,
    formatCurrencyAmount: logic.formatCurrencyAmount,
    updateSavingsAccount: logic.updateSavingsAccount,
    deleteSavingsAccount: logic.deleteSavingsAccount,
    requestDelete: logic.requestDelete,
    openLedgerModal: ui.openLedgerModal,
    isReader: logic.isReader,
  };

  const goalsSectionProps = {
    goals: logic.goals,
    updateSavingsAccount: logic.updateSavingsAccount,
    deleteSavingsAccount: logic.deleteSavingsAccount,
    requestDelete: logic.requestDelete,
    openLedgerModal: ui.openLedgerModal,
    isReader: logic.isReader,
    selectedMonth: logic.selectedMonth,
    selectedYear: logic.selectedYear,
  };

  const investmentsSectionProps = {
    investments: logic.investments,
    sumPersonalInvestments: logic.sumPersonalInvestments,
    sumWifeInvestments: logic.sumWifeInvestments,
    getInvestmentValue: logic.getInvestmentValue,
    getMaturityAmount: logic.getMaturityAmount,
    updateInvestment: logic.updateInvestment,
    deleteInvestment: logic.deleteInvestment,
    requestDelete: logic.requestDelete,
    editingInvId: ui.editingInvId,
    editingInvValue: ui.editingInvValue,
    setEditingInvValue: ui.setEditingInvValue,
    editingPayoutInvId: ui.editingPayoutInvId,
    setEditingPayoutInvId: ui.setEditingPayoutInvId,
    editingPayoutAmount: ui.editingPayoutAmount,
    setEditingPayoutAmount: ui.setEditingPayoutAmount,
    editingPayoutDate: ui.editingPayoutDate,
    setEditingPayoutDate: ui.setEditingPayoutDate,
    startEditInvestmentValue: ui.startEditInvestmentValue,
    saveInvestmentValue: logic.saveInvestmentValue,
    cancelEditInvestmentValue: ui.cancelEditInvestmentValue,
    saveInvestmentPayout: logic.saveInvestmentPayout,
    isReader: logic.isReader,
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Megtakarítások' }, { label: 'Széf' }]}
        title="Megtakarítások · Széf"
        description="Számlák, megtakarítási célok és vagyon — kasszánként."
        meta={<WalletSwitcher />}
        actions={
          !logic.isReader ? (
            <Button size="sm" onClick={() => ui.openNewAsset()}>
              <Plus size={13} /> Új
            </Button>
          ) : undefined
        }
      />

      {!logic.walletDataReady ? (
        <SavingsPageSkeleton />
      ) : (
        <>
          <MetricStrip items={logic.savingsMetrics} columns={4} variant="separated" />
          <SavingsAccountsSection {...accountsSectionProps} />
          <SavingsGoalsSection {...goalsSectionProps} />
          <SavingsInvestmentsSection {...investmentsSectionProps} />
        </>
      )}

      <NewAssetModal
        isOpen={ui.isNewAssetModalOpen}
        onClose={() => ui.setIsNewAssetModalOpen(false)}
        initialKind={ui.newAssetInitialKind}
        onAddSavingsAccount={logic.addSavingsAccount}
        onAddInvestment={logic.addInvestment}
        savingsSettings={logic.savingsSettings}
        saving={logic.assetSaving}
      />

      <SavingsLedgerModal
        isLedgerModalOpen={ui.isLedgerModalOpen}
        closeLedgerModal={ui.closeLedgerModal}
        ledgerType={ui.ledgerType}
        setLedgerType={ui.setLedgerType}
        ledgerAmount={ui.ledgerAmount}
        setLedgerAmount={ui.setLedgerAmount}
        ledgerReason={ui.ledgerReason}
        setLedgerReason={ui.setLedgerReason}
        ledgerDate={ui.ledgerDate}
        setLedgerDate={ui.setLedgerDate}
        editingLedgerId={ui.editingLedgerId}
        clearLedgerForm={ui.clearLedgerForm}
        startEditLedger={ui.startEditLedger}
        handleLedgerSubmit={logic.handleLedgerSubmit}
        handleDeleteLedgerEntry={logic.handleDeleteLedgerEntry}
        ledgerSaving={logic.ledgerSaving}
        formatCurrencyAmount={logic.formatCurrencyAmount}
        ledgerCurrency={logic.ledgerCurrency}
        ledgerItems={logic.ledgerItems}
        isReader={logic.isReader}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
