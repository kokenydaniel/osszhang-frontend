'use client';

import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip } from '@/components/design';
import { Copy, Plus } from 'lucide-react';
import { useBudgetLogic } from '@/components/modules/budget/BudgetLogicContext';
import { BudgetBalancePanel } from '@/components/modules/budget/budget-balance-panel';
import { BudgetAiOverspendBanner } from '@/components/modules/budget/budget-ai-overspend-banner';
import { BudgetCategorySummary } from '@/components/modules/budget/budget-category-summary';
import { BudgetTransactionFeed } from '@/components/modules/budget/budget-transaction-feed';
import { BudgetTransactionModal } from '@/components/modules/budget/budget-transaction-modal';
import { BudgetLedgerModal } from '@/components/modules/budget/budget-ledger-modal';
import { BudgetPageGridSkeleton } from '@/components/modules/budget/budget-page-skeleton';
import { WalletSwitcher } from '@/components/wallets/WalletSwitcher';

export function BudgetPage() {
  const logic = useBudgetLogic();
  const { ConfirmDeleteModal } = logic;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Költségvetés' }]}
        title="Cashflow"
        description="Bevételek, kiadások és tárgyhavi rezsi — egy nézetben."
        meta={<WalletSwitcher />}
        actions={
          <>
            {!logic.isReader ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  loading={logic.cloning}
                  onClick={() => void logic.runClone(() => logic.clonePreviousMonth(logic.selectedMonth, logic.selectedYear, logic.loadedWalletId!))}
                >
                  {!logic.cloning && <Copy size={13} />} {logic.cloning ? 'Másolás…' : 'Múlt havi'}
                </Button>
                <Button size="sm" onClick={() => logic.openTxForm(null)}>
                  <Plus size={13} /> Új tétel
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <BudgetBalancePanel {...logic} />
        <MetricStrip items={logic.cashflowMetrics} columns={3} variant="separated" />
      </div>

      <BudgetAiOverspendBanner aiOverspend={logic.aiOverspend} />

      <MetricStrip items={logic.summaryMetrics} columns={4} />

      {!logic.gridLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <BudgetCategorySummary categoryData={logic.categoryData} totalProjectedExpense={logic.totalProjectedExpense} />

          <div className="flex flex-col gap-7">
            <BudgetTransactionFeed {...logic} items={logic.incomes} title="Bevételek" type="income" />
            {logic.reserves.length > 0 && (
              <BudgetTransactionFeed {...logic} items={logic.reserves} title="Tartalékok" type="expense" />
            )}
            <BudgetTransactionFeed {...logic} items={logic.expenses} title="Kiadások" type="expense" includeBills />
          </div>
        </div>
      ) : (
        <BudgetPageGridSkeleton />
      )}

      <BudgetTransactionModal />
      <BudgetLedgerModal />
      <ConfirmDeleteModal />
    </div>
  );
}
