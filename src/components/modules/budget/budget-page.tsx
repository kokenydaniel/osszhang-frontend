'use client';

import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip } from '@/components/design';
import { Copy, Plus } from 'lucide-react';
import { useBudgetPageState } from '@/components/modules/budget/hooks/use-budget-page-state';
import { BudgetBalancePanel } from '@/components/modules/budget/budget-balance-panel';
import { BudgetAiOverspendBanner } from '@/components/modules/budget/budget-ai-overspend-banner';
import { BudgetCategorySummary } from '@/components/modules/budget/budget-category-summary';
import { BudgetTransactionFeed } from '@/components/modules/budget/budget-transaction-feed';
import { BudgetTransactionModal } from '@/components/modules/budget/budget-transaction-modal';
import { BudgetLedgerModal } from '@/components/modules/budget/budget-ledger-modal';

export default function BudgetPage() {
  const state = useBudgetPageState();
  const { ConfirmDeleteModal } = state;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Költségvetés' }]}
        title="Cashflow"
        description="Bevételek, kiadások és tárgyhavi rezsi — egy nézetben."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              loading={state.cloning}
              onClick={() => void state.runClone(() => state.clonePreviousMonth(state.selectedMonth, state.selectedYear))}
            >
              {!state.cloning && <Copy size={13} />} {state.cloning ? 'Másolás…' : 'Múlt havi'}
            </Button>
            <Button size="sm" onClick={() => state.openTxForm(null)}>
              <Plus size={13} /> Új tétel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <BudgetBalancePanel {...state} />
        <MetricStrip items={state.cashflowMetrics} columns={3} variant="separated" />
      </div>

      <BudgetAiOverspendBanner aiOverspend={state.aiOverspend} />

      <MetricStrip items={state.summaryMetrics} columns={4} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <BudgetCategorySummary categoryData={state.categoryData} totalProjectedExpense={state.totalProjectedExpense} />

        <div className="flex flex-col gap-7">
          <BudgetTransactionFeed {...state} items={state.incomes} title="Bevételek" type="income" />
          {state.reserves.length > 0 && (
            <BudgetTransactionFeed {...state} items={state.reserves} title="Tartalékok" type="expense" />
          )}
          <BudgetTransactionFeed {...state} items={state.expenses} title="Kiadások" type="expense" includeBills />
        </div>
      </div>

      <BudgetTransactionModal {...state} />
      <BudgetLedgerModal {...state} />
      <ConfirmDeleteModal />
    </div>
  );
}
