'use client';

import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip, ModulePageSkeleton } from '@/components/design';
import { Plus, Info } from 'lucide-react';
import { useDebtsLogic } from '@/components/modules/debts/hooks/useDebtsLogic';
import { DebtsTable } from '@/components/modules/debts/debts-table';
import { DebtsStrategySection } from '@/components/modules/debts/debts-strategy-section';
import { DebtsFormModal } from '@/components/modules/debts/debts-form-modal';
import { DebtsPayModal } from '@/components/modules/debts/debts-pay-modal';
import { WalletSwitcher } from '@/components/wallets/WalletSwitcher';

export default function DebtsPage() {
  const logic = useDebtsLogic();
  const { ConfirmDeleteModal } = logic;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Tartozások' }]}
        title="Tartozások"
        description="Hitelek, kölcsönök — pontos lejárattal és költségvetés-integrációval."
        meta={<WalletSwitcher />}
        actions={
          !logic.isReader ? (
            <Button size="sm" onClick={() => logic.openForm()}>
              <Plus size={13} /> Új tartozás
            </Button>
          ) : undefined
        }
      />

      {logic.pageLoading ? (
        <ModulePageSkeleton />
      ) : (
        <>
      <MetricStrip items={logic.metrics} columns={4} variant="separated" />

      {logic.debtsWithPayoff.length > 0 && (
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
      )}

      {logic.debtsWithPayoff.length > 0 && <DebtsStrategySection {...logic} />}

      <DebtsTable {...logic} />
        </>
      )}

      <DebtsFormModal onSubmit={logic.saveDebt} saving={logic.debtSaving} />
      <DebtsPayModal
        categories={logic.categories}
        selectedYear={logic.selectedYear}
        selectedMonth={logic.selectedMonth}
        onSubmit={logic.recordPayment}
      />
      <ConfirmDeleteModal />
    </div>
  );
}
