'use client';

import { LedgerEntry } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LedgerHistoryPanel } from '@/components/design';
import { HELP } from '@/lib/helpTexts';
import { Plus } from 'lucide-react';
import type { BudgetPageState } from '@/components/modules/budget/hooks/use-budget-page-state';

type BudgetLedgerModalProps = Pick<
  BudgetPageState,
  | 'isLedgerModalOpen'
  | 'closeLedgerModal'
  | 'ledgerAmount'
  | 'setLedgerAmount'
  | 'ledgerReason'
  | 'setLedgerReason'
  | 'handleLedgerSubmit'
  | 'activeLedgerItems'
>;

export function BudgetLedgerModal({
  isLedgerModalOpen,
  closeLedgerModal,
  ledgerAmount,
  setLedgerAmount,
  ledgerReason,
  setLedgerReason,
  handleLedgerSubmit,
  activeLedgerItems,
}: BudgetLedgerModalProps) {
  return (
    <Modal
      isOpen={isLedgerModalOpen}
      onClose={closeLedgerModal}
      title="Költés rögzítése (ledger)"
      description={HELP.budget.ledgerModalIntro}
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <FieldLabel
            info={HELP.budget.ledgerAmount}
            hint="Egy konkrét vásárlás / költés összege — összeadódik a „felhasználva” sávban."
          >
            Összeg (felhasznált)
          </FieldLabel>
          <Input
            type="number"
            placeholder="0"
            value={ledgerAmount}
            onChange={(e) => setLedgerAmount(e.target.value)}
            step="any"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel info={HELP.budget.ledgerNote} hint="pl. „Aldi 12.450 Ft” — később visszakereshető.">
            Megjegyzés
          </FieldLabel>
          <Input
            placeholder="pl. Heti bevásárlás"
            value={ledgerReason}
            onChange={(e) => setLedgerReason(e.target.value)}
          />
        </div>

        <Button onClick={handleLedgerSubmit}>
          <Plus size={13} /> Rögzítés
        </Button>

        <LedgerHistoryPanel items={activeLedgerItems as LedgerEntry[] | undefined} />
      </div>
    </Modal>
  );
}
