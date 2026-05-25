'use client';

import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip } from '@/components/design';
import { Plus, Info } from 'lucide-react';
import { useDebtsPageState } from '@/components/modules/debts/hooks/use-debts-page-state';
import { DebtsTable } from '@/components/modules/debts/debts-table';
import { DebtsStrategySection } from '@/components/modules/debts/debts-strategy-section';
import { DebtsFormModal } from '@/components/modules/debts/debts-form-modal';
import { DebtsPayModal } from '@/components/modules/debts/debts-pay-modal';
import { WalletSwitcher } from '@/components/wallets/WalletSwitcher';

export default function DebtsPage() {
  const state = useDebtsPageState();
  const { ConfirmDeleteModal } = state;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Tartozások' }]}
        title="Tartozások"
        description="Hitelek, kölcsönök — pontos lejárattal és költségvetés-integrációval."
        meta={<WalletSwitcher />}
        actions={
          !state.isReader ? (
            <Button size="sm" onClick={() => state.openForm()}>
              <Plus size={13} /> Új tartozás
            </Button>
          ) : undefined
        }
      />

      <MetricStrip items={state.metrics} columns={4} variant="separated" />

      {state.debtsWithPayoff.length > 0 && (
        <div className="rounded-lg border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card px-4 py-3 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Info size={14} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Hogyan használd?
            </p>
            <p className="text-[0.78rem] text-muted-foreground mt-0.5 leading-relaxed">
              A „Lejár" oszlop a havi részlet és a kamat alapján mutatja, mikor fut ki a hitel. A „Befizetés"
              gombbal egyszerre tudod csökkenteni a tartozást, és a havi törlesztést rögzíteni a költségvetésbe is.
            </p>
          </div>
        </div>
      )}

      {state.debtsWithPayoff.length > 0 && <DebtsStrategySection {...state} />}

      <DebtsTable {...state} />

      <DebtsFormModal {...state} />
      <DebtsPayModal {...state} />
      <ConfirmDeleteModal />
    </div>
  );
}
