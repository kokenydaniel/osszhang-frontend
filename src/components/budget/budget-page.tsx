'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip, SegmentedControl, ModulePageSkeleton } from '@/components/design';
import { BarChart3, CalendarDays, Copy, Plus } from 'lucide-react';
import { useBudgetYearData } from '@/hooks/useBudgetYearData';
import { BudgetYearTab } from './budget-year-tab';
import { WalletSwitcherContainer as WalletSwitcher } from '@/components/layout/wallet-switcher-container';
import { useBudgetPageData } from '@/hooks/useBudgetPageData';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { budgetClient, debtsClient, insuranceClient, rentalClient, walletClient } from '@/lib/api-client';
import { buildDebtInstallmentBudgetUpdate, parseDebtInstallmentId } from '@/helpers/debt-budget';
import { isExternallyManagedBudgetRow } from '@/helpers/budget-feed';
import {
  parseInsurancePremiumId,
  withInsurancePeriodPaid,
  withInsurancePeriodUnpaid,
} from '@/helpers/insurance-budget';
import { parseRentalIncomeId } from '@/helpers/rental-budget';
import { useDebtsStore } from '@/stores/debtsStore';
import { useInsuranceStore } from '@/stores/insuranceStore';
import { useRentalStore } from '@/stores/rentalStore';
import { budgetStore } from '@/stores/budgetStore';
import { StatusCodes } from '@/types/api';
import { canEditHousehold } from '@/utils/household-role';
import { useAuthStore } from '@/stores/useAuthStore';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { today as todayDate } from '@/utils';
import type { CashTransaction } from '@/types';
import { BudgetBalancePanel } from './budget-balance-panel';
import { BudgetMissedIncomeBanner } from './budget-missed-income-banner';
import { BudgetMonthInsightsSection } from './budget-month-insights-section';
import { BudgetCategorySummary } from './budget-category-summary';
import { BudgetTransactionFeed } from './budget-transaction-feed';
import {
  BudgetTransactionModal,
  type BudgetTxModalTarget,
} from './budget-transaction-modal';
import { BudgetLedgerModal, type BudgetLedgerModalTarget } from './budget-ledger-modal';
import { BudgetPageGridSkeleton } from './budget-page-skeleton';

export function BudgetPage() {
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { wrap: wrapTxPending, isPending: isTxPending } = usePendingIds();

  const [manualBalanceInput, setManualBalanceInput] = useState('0');
  const [balanceSaved, setBalanceSaved] = useState(false);
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [txModal, setTxModal] = useState<BudgetTxModalTarget | null>(null);
  const [ledgerModal, setLedgerModal] = useState<BudgetLedgerModalTarget | null>(null);
  const [activeView, setActiveView] = useState<'month' | 'year'>('month');

  const manualBalanceNum = Number(manualBalanceInput) || 0;
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  const data = useBudgetPageData(manualBalanceNum);
  const yearData = useBudgetYearData({
    activeWalletId: data.activeWalletId,
    selectedYear: data.selectedYear,
    enabled: activeView === 'year',
  });

  useEffect(() => {
    setManualBalanceInput(String(data.walletManualBalance));
    setBalanceSaved(false);
  }, [data.walletManualBalance, data.activeWalletId]);

  const ledgerItems = useMemo(
    () => (ledgerModal ? data.getLedgerItems(ledgerModal.txId) : undefined),
    [data, ledgerModal],
  );

  const feedCommon = {
    categories: data.categories,
    monthlyBills: data.monthlyBills,
    getBillPortion: data.getBillPortion,
    today: todayDate(),
    isReader: data.isReader,
    categoryColor: data.categoryColor,
    exchangeRates,
    onEdit: (tx: CashTransaction) => {
      if (!canEditHousehold(data.user)) return;
      setTxModal({ mode: 'edit', transaction: tx });
    },
    onOpenLedger: (txId: number | string) => {
      if (!canEditHousehold(data.user)) return;
      setLedgerModal({
        txId,
        isGoal: false,
        goalTitle: '',
        defaultAmount: '',
        defaultReason: '',
      });
    },
    onOpenGoalPayment: (goalRow: CashTransaction) => {
      if (!canEditHousehold(data.user)) return;
      const title = goalRow.description.replace(/^Cél:\s*/, '');
      const planned = goalRow.amount > 0 ? String(Math.round(goalRow.amount)) : '';
      setLedgerModal({
        txId: goalRow.id,
        isGoal: true,
        goalTitle: title,
        defaultAmount: planned,
        defaultReason: `Költségvetés – ${title}`,
      });
    },
    onUpdateTransaction: updateTransaction,
    onDeleteTransaction: deleteTransaction,
    requestDelete,
    wrapTxPending,
    isTxPending,
  };

  const handleManualBalanceSave = useCallback(async () => {
    if (!canEditHousehold(data.user)) return;
    if (data.activeWalletId === null) return;

    setBalanceSaving(true);
    try {
      const res = await walletClient.updateManualBalance(
        data.activeWalletId,
        Number(manualBalanceInput) || 0,
      );
      if (!res || res[0] !== StatusCodes.Http200) throw new Error();
      await useAuthStore.getState().fetchMe();
      setBalanceSaved(true);
      window.setTimeout(() => setBalanceSaved(false), 2000);
    } catch {
      addNotification('Az egyenleg mentése nem sikerült.', 'error');
    } finally {
      setBalanceSaving(false);
    }
  }, [addNotification, data.activeWalletId, data.user, manualBalanceInput]);

  const handleTxSaved = useCallback(
    (saved: CashTransaction, mode: 'create' | 'update') => {
      if (mode === 'create') {
        data.setTransactions([...data.transactions, saved]);
        addNotification('Tétel létrehozva.', 'success');
      } else {
        data.setTransactions(
          data.transactions.map((t) => (t.id === saved.id ? saved : t)),
        );
        addNotification('Tétel frissítve.', 'success');
      }
    },
    [addNotification, data],
  );

  const handleLedgerSaved = useCallback(
    (updated: CashTransaction, isGoal: boolean) => {
      if (isGoal) {
        data.setGoalRows(
          data.goalBudgetRows.map((row) => (row.id === updated.id ? updated : row)),
        );
        addNotification('Befizetés rögzítve.', 'success');
      } else {
        data.setTransactions(
          data.transactions.map((t) => (t.id === updated.id ? updated : t)),
        );
        addNotification('Költés rögzítve.', 'success');
      }
    },
    [addNotification, data],
  );

  async function updateTransaction(
    id: number | string,
    patch: Partial<Omit<CashTransaction, 'id'>>,
  ) {
    const installment = parseDebtInstallmentId(id);
    if (installment) {
      const debt = data.debts.find((d) => d.id === installment.debtId);
      if (!debt) return;
      try {
        const paid = !!patch.paidDate;
        const res = await debtsClient.update(
          debt.id,
          buildDebtInstallmentBudgetUpdate(
            debt,
            installment.year,
            installment.month,
            paid,
            patch.paidDate ?? todayDate(),
          ),
        );
        if (!res || res[0] !== StatusCodes.Http200) throw new Error();
        useDebtsStore.getState().patchDebt(debt.id, res[1]);
        if (paid && patch.paidDate) {
          addNotification('Tartozás részlet kifizetve.', 'success');
        }
      } catch {
        addNotification('A tartozás részlet állapota nem menthető.', 'error');
      }
      return;
    }

    const insuranceLine = parseInsurancePremiumId(id);
    if (insuranceLine) {
      const policy = data.insurancePolicies.find((p) => p.id === insuranceLine.policyId);
      if (!policy) return;
      try {
        const paid = !!patch.paidDate;
        const nextPolicy = paid
          ? withInsurancePeriodPaid(policy, insuranceLine.year, insuranceLine.month)
          : withInsurancePeriodUnpaid(policy, insuranceLine.year, insuranceLine.month);
        const res = await insuranceClient.update(policy.id, {
          paidBudgetPeriods: nextPolicy.paidBudgetPeriods,
        });
        if (!res || res[0] !== StatusCodes.Http200) throw new Error();
        useInsuranceStore.getState().upsertPolicy(res[1]);
        void useInsuranceStore.getState().fetch(true);
        if (paid) {
          addNotification('Biztosítási díj kifizetve.', 'success');
        }
      } catch {
        addNotification('A biztosítás díj állapota nem menthető.', 'error');
      }
      return;
    }

    const rentalLine = parseRentalIncomeId(id);
    if (rentalLine) {
      const entry = data.rentalIncomeEntries.find(
        (e: (typeof data.rentalIncomeEntries)[number]) =>
          e.rentalPropertyId === rentalLine.propertyId &&
          e.periodYear === rentalLine.year &&
          e.periodMonth === rentalLine.month,
      );
      const property = data.rentalProperties.find(
        (p: (typeof data.rentalProperties)[number]) => p.id === rentalLine.propertyId,
      );
      if (!property?.budgetSyncEnabled) return;
      try {
        const paid = !!patch.paidDate;
        const paidDate = patch.paidDate ?? todayDate();
        if (entry) {
          const res = await rentalClient.updateIncome(entry.id, {
            paidDate: paid ? paidDate : null,
          });
          if (!res || res[0] !== StatusCodes.Http200) throw new Error();
          useRentalStore.getState().upsertIncome(res[1]);
        } else if (paid) {
          const res = await rentalClient.createIncome({
            rentalPropertyId: rentalLine.propertyId,
            periodYear: rentalLine.year,
            periodMonth: rentalLine.month,
            amount: property.monthlyRent + property.monthlyCommonCost,
            rentAmount: property.monthlyRent,
            commonCostAmount: property.monthlyCommonCost,
            currency: property.currency,
            paidDate,
          });
          if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
            throw new Error();
          }
          useRentalStore.getState().upsertIncome(res[1]);
        }
        void useRentalStore.getState().fetch(data.selectedYear, data.selectedMonth, true);
        if (paid) {
          addNotification('Bérleti díj befizetve.', 'success');
        }
      } catch {
        addNotification('A bérleti díj állapota nem menthető.', 'error');
      }
      return;
    }

    if (typeof id !== 'number') return;

    const previous = budgetStore.getState().transactions.find((t) => t.id === id);
    if (!previous) return;

    const optimistic: CashTransaction = { ...previous, ...patch };
    budgetStore.getState().patchTransaction(id, optimistic);

    try {
      const res = await budgetClient.update(id, patch);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error();
      budgetStore.getState().patchTransaction(id, res[1]);
      if (res[1].type === 'income' || patch.paidDate !== undefined) {
        void data.refreshMissedIncome();
      }
    } catch {
      budgetStore.getState().patchTransaction(id, previous);
      addNotification('A tétel frissítése nem sikerült.', 'error');
    }
  }

  async function deleteTransaction(id: number | string) {
    if (isExternallyManagedBudgetRow(id)) {
      addNotification(
        'A szinkronizált díjat a Biztosítások vagy Tartozások modulban kezeld — a költségvetésből nem törölhető.',
        'error',
      );
      return;
    }
    if (typeof id !== 'number') return;

    try {
      const tx = data.transactions.find((t) => t.id === id);
      const res = await budgetClient.delete(id);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) {
        throw new Error();
      }
      const wasIncome = tx?.type === 'income' && !tx?.isReserve;
      data.setTransactions(data.transactions.filter((t) => t.id !== id));
      if (wasIncome) void data.refreshMissedIncome();
      addNotification('Tétel törölve.', 'success');
      if (tx?.category === 'Rezsi elszámolás') {
        void useAuthStore.getState().fetchMe();
      }
    } catch {
      addNotification('A tétel törlése nem sikerült.', 'error');
    }
  }

  const clonePreviousMonth = () => {
    if (data.activeWalletId === null) return;
    void runClone(async () => {
      await budgetClient.cloneMonth(data.selectedMonth, data.selectedYear, data.activeWalletId!);
      await data.refresh();
      addNotification('Előző hónap másolva.', 'success');
    });
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Költségvetés' }]}
        title="Cashflow"
        description="Bevételek, kiadások és tárgyhavi rezsi — egy nézetben."
        meta={<WalletSwitcher />}
        actions={
          <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto">
            <SegmentedControl
              layoutId="budget-view-tabs"
              equalWidth
              nowrap
              className="w-full sm:w-auto"
              value={activeView}
              onChange={(value) => setActiveView(value as 'month' | 'year')}
              options={[
                { value: 'month', label: 'Aktuális hónap', icon: CalendarDays },
                { value: 'year', label: 'Éves nézet', icon: BarChart3 },
              ]}
            />
            {activeView === 'month' && !data.isReader ? (
              <div className="flex w-full flex-row items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 min-w-0 justify-center sm:flex-none"
                  loading={cloning}
                  onClick={clonePreviousMonth}
                >
                  {!cloning && <Copy size={13} />} {cloning ? 'Másolás…' : 'Múlt havi'}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 min-w-0 justify-center sm:flex-none"
                  onClick={() => setTxModal({ mode: 'create', defaultType: 'expense' })}
                >
                  <Plus size={13} /> Új tétel
                </Button>
              </div>
            ) : null}
          </div>
        }
      />

      {activeView === 'month' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <BudgetBalancePanel
              manualBalance={manualBalanceInput}
              onManualBalanceChange={(v) => {
                setManualBalanceInput(v);
                setBalanceSaved(false);
              }}
              balanceSaving={balanceSaving}
              balanceSaved={balanceSaved}
              onSave={() => void handleManualBalanceSave()}
              isReader={data.isReader}
            />
            <MetricStrip items={data.cashflowMetrics} columns={3} variant="separated" />
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            Külföldi pénznemű tételeknél az összeg eredeti valutában marad; a fenti mutatók és a lista forintra
            számolnak az élő árfolyamon.
          </p>

          <BudgetMissedIncomeBanner summary={data.missedIncomeSummary} />

          <MetricStrip items={data.summaryMetrics} columns={4} variant="separated" />

          <BudgetMonthInsightsSection
            year={data.selectedYear}
            month={data.selectedMonth}
            walletId={data.activeWalletId}
            aiOverspend={data.aiOverspend}
          />

          {!data.isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              <BudgetCategorySummary
                categoryData={data.categoryData}
                totalProjectedExpense={data.totalProjectedExpense}
                categoryColor={data.categoryColor}
              />

              <div className="flex flex-col gap-7">
                <BudgetTransactionFeed
                  {...feedCommon}
                  items={data.incomes}
                  title="Bevételek"
                  type="income"
                />
                {data.reserves.length > 0 ? (
                  <BudgetTransactionFeed
                    {...feedCommon}
                    items={data.reserves}
                    title="Tartalékok"
                    type="expense"
                  />
                ) : null}
                <BudgetTransactionFeed
                  {...feedCommon}
                  items={data.expenses}
                  title="Kiadások"
                  type="expense"
                  includeBills
                />
              </div>
            </div>
          ) : (
            <BudgetPageGridSkeleton />
          )}
        </>
      ) : yearData.loading ? (
        <ModulePageSkeleton />
      ) : (
        <>
          <MetricStrip items={yearData.yearMetrics} columns={4} variant="separated" />
          <BudgetYearTab
            selectedYear={yearData.selectedYear}
            previousYear={yearData.previousYear}
            snapshot={yearData.snapshot}
            insights={yearData.yearInsights}
            showDebts={yearData.canUseDebts}
            showSavings={yearData.canUseSavings}
            categoryColor={data.categoryColor}
          />
        </>
      )}

      <BudgetTransactionModal
        open={txModal !== null}
        target={txModal}
        categories={data.categories}
        onClose={() => setTxModal(null)}
        onSaved={handleTxSaved}
      />

      <BudgetLedgerModal
        open={ledgerModal !== null}
        target={ledgerModal}
        ledgerItems={ledgerItems}
        selectedYear={data.selectedYear}
        selectedMonth={data.selectedMonth}
        activeWalletId={data.activeWalletId}
        onClose={() => setLedgerModal(null)}
        onSaved={handleLedgerSaved}
        requestDelete={requestDelete}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
