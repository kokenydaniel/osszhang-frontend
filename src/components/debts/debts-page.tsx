'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip, ModulePageSkeleton } from '@/components/design';
import { Plus, Info } from 'lucide-react';
import { WalletSwitcherContainer as WalletSwitcher } from '@/components/layout/wallet-switcher-container';
import { useDebtsStore } from '@/stores/debtsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { debtsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { debtsCalculations } from '@/calculations/debts';
import { resolveDebtsSettings } from '@/settings/debts';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { isStoreLoading } from '@/utils/loadable-status';
import type { Debt } from '@/types';
import { DebtsTable } from './debts-table';
import { DebtsStrategySection } from './debts-strategy-section';
import { DebtFormModal } from './debt-form-modal';
import { DebtPayModal } from './debt-pay-modal';
import { DebtDocumentsModal } from './debt-documents-modal';
import { DebtPaymentHistoryModal } from './debt-payment-history-modal';

export function DebtsPage() {
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const user = useAuthStore((s) => s.user);
  const { selectedYear, selectedMonth } = usePeriodStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const debts = useDebtsStore((s) => s.debts);
  const aiDebtPlan = useDebtsStore((s) => s.aiDebtPlan);
  const status = useDebtsStore((s) => s.status);
  const setDebts = useDebtsStore((s) => s.setDebts);
  const setAiDebtPlan = useDebtsStore((s) => s.setAiDebtPlan);

  useEffect(() => {
    void useDebtsStore.getState().fetch(activeWalletId);
  }, [activeWalletId]);

  const [formDebt, setFormDebt] = useState<Debt | 'create' | null>(null);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);
  const [documentsDebt, setDocumentsDebt] = useState<Debt | null>(null);
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null);

  const isReader = isHouseholdReader(user);
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const categories = user?.household?.categories?.length
    ? user.household.categories
    : ['Fizetés', 'Élelmiszer', 'Rezsi'];

  const debtsWithPayoff = useMemo(() => debtsCalculations.enrichWithPayoff(debts), [debts]);
  const summary = useMemo(
    () => debtsCalculations.buildSummaryMetrics(debts, debtsWithPayoff),
    [debts, debtsWithPayoff],
  );
  const metrics = useMemo(
    () => debtsCalculations.buildMetricStrip(summary, debtsWithPayoff.length),
    [summary, debtsWithPayoff.length],
  );

  const handleDebtSaved = useCallback(
    (saved: Debt, mode: 'create' | 'update') => {
      if (!activeWalletId) return;
      if (mode === 'create') {
        setDebts([...debts, saved], activeWalletId);
        addNotification('Tartozás létrehozva.', 'success');
      } else {
        setDebts(
          debts.map((d) => (d.id === saved.id ? saved : d)),
          activeWalletId,
        );
        addNotification('Tartozás frissítve.', 'success');
      }
    },
    [activeWalletId, addNotification, debts, setDebts],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      if (!activeWalletId) return;
      try {
        const res = await debtsClient.delete(id);
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) {
          throw new Error('API Error');
        }
        setDebts(
          debts.filter((d) => d.id !== id),
          activeWalletId,
        );
        addNotification('Tartozás törölve.', 'success');
      } catch {
        addNotification('A tartozás törlése nem sikerült.', 'error');
      }
    },
    [activeWalletId, addNotification, debts, setDebts],
  );

  const handlePaid = useCallback(
    (updated: Debt, payAddToBudget: boolean) => {
      if (!activeWalletId) return;
      setDebts(
        debts.map((d) => (d.id === updated.id ? updated : d)),
        activeWalletId,
      );
      addNotification(
        `Törlesztés rögzítve${payAddToBudget ? ' (költségvetésben is)' : ''}.`,
        'success',
      );
    },
    [activeWalletId, addNotification, debts, setDebts],
  );

  const pageLoading = activeWalletId !== null && isStoreLoading(status);

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Tartozások' }]}
        title="Tartozások"
        description="Hitelek, kölcsönök — pontos lejárattal és költségvetés-integrációval."
        meta={<WalletSwitcher />}
        actions={
          !isReader ? (
            <Button size="sm" onClick={() => setFormDebt('create')}>
              <Plus size={13} /> Új tartozás
            </Button>
          ) : undefined
        }
      />

      {pageLoading ? (
        <ModulePageSkeleton />
      ) : (
        <>
          <MetricStrip items={metrics} columns={4} variant="separated" />

          {debtsWithPayoff.length > 0 ? (
            <div className="rounded-lg border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card px-4 py-3 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Info size={14} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Hogyan használd?</p>
                <p className="text-[0.78rem] text-muted-foreground mt-0.5 leading-relaxed">
                  A „Lejár" oszlop a havi részlet és a kamat alapján mutatja, mikor fut ki a hitel. A „Befizetés"
                  gombbal egyszerre tudod csökkenteni a tartozást, és a havi törlesztést rögzíteni a költségvetésbe is.
                </p>
              </div>
            </div>
          ) : null}

          {debtsWithPayoff.length > 0 ? (
            <DebtsStrategySection
              walletId={activeWalletId}
              debtsSettings={debtsSettings}
              debtsWithPayoff={debtsWithPayoff}
              aiDebtPlan={aiDebtPlan}
              onAiPlanChange={setAiDebtPlan}
              farthestPayoff={summary.farthestPayoff}
              totalInterestRemaining={summary.totalInterestRemaining}
            />
          ) : null}

          <DebtsTable
            debtsWithPayoff={debtsWithPayoff}
            totalDebt={summary.totalDebt}
            monthlyMinimum={summary.monthlyMinimum}
            isReader={isReader}
            onPay={(debt) => {
              if (!canEditHousehold(user)) return;
              setPayDebt(debt);
            }}
            onEdit={(debt) => {
              if (!canEditHousehold(user)) return;
              setFormDebt(debt);
            }}
            onViewDocuments={(debt) => setDocumentsDebt(debt)}
            onViewPaymentHistory={(debt) => setHistoryDebt(debt)}
            onDelete={handleDelete}
            requestDelete={requestDelete}
          />
        </>
      )}

      <DebtFormModal
        open={formDebt !== null}
        debt={formDebt === 'create' ? null : formDebt}
        walletId={activeWalletId}
        onClose={() => setFormDebt(null)}
        onSaved={handleDebtSaved}
      />

      <DebtPaymentHistoryModal
        open={historyDebt !== null}
        debt={historyDebt}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        canEdit={!isReader}
        onClose={() => setHistoryDebt(null)}
        onDebtUpdated={(updated) => setHistoryDebt(updated)}
      />

      <DebtDocumentsModal
        open={documentsDebt !== null}
        debt={documentsDebt}
        canEdit={!isReader}
        onClose={() => setDocumentsDebt(null)}
        onCountChange={(debtId, count) => {
          if (!activeWalletId) return;
          setDebts(
            debts.map((d) => (d.id === debtId ? { ...d, attachmentCount: count } : d)),
            activeWalletId,
          );
          setDocumentsDebt((current) =>
            current?.id === debtId ? { ...current, attachmentCount: count } : current,
          );
        }}
      />

      <DebtPayModal
        open={payDebt !== null}
        debt={payDebt}
        walletId={activeWalletId}
        user={user}
        categories={categories}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onClose={() => setPayDebt(null)}
        onPaid={(updated, payAddToBudget) => handlePaid(updated, payAddToBudget)}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
