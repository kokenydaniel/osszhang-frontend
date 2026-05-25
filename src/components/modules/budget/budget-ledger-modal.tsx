'use client';

import { LedgerEntry } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LedgerHistoryPanel } from '@/components/design';
import { HELP } from '@/lib/helpTexts';
import { Check, Plus } from 'lucide-react';
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
  | 'ledgerIsGoalPayment'
  | 'ledgerGoalTitle'
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
  ledgerIsGoalPayment,
  ledgerGoalTitle,
}: BudgetLedgerModalProps) {
  const isGoal = ledgerIsGoalPayment;

  return (
    <Modal
      isOpen={isLedgerModalOpen}
      onClose={closeLedgerModal}
      title={isGoal ? `Befizetés: ${ledgerGoalTitle}` : 'Költés rögzítése (ledger)'}
      description={
        isGoal
          ? 'A tervezett havi összeg előre kitöltve — ellenőrizd, majd mentsd a befizetést.'
          : HELP.budget.ledgerModalIntro
      }
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <FieldLabel
            info={HELP.budget.ledgerAmount}
            hint={
              isGoal
                ? 'A hónapra tervezett megtakarítási összeg — módosíthatod, ha más összeget fizetsz be.'
                : 'Egy konkrét vásárlás / költés összege — összeadódik a „felhasználva” sávban.'
            }
          >
            {isGoal ? 'Befizetés összege' : 'Összeg (felhasznált)'}
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
          <FieldLabel
            info={HELP.budget.ledgerNote}
            hint={isGoal ? 'Automatikusan kitöltve a cél nevével.' : 'pl. „Aldi 12.450 Ft” — később visszakereshető.'}
          >
            Megjegyzés
          </FieldLabel>
          <Input
            placeholder={isGoal ? 'Költségvetés – cél neve' : 'pl. Heti bevásárlás'}
            value={ledgerReason}
            onChange={(e) => setLedgerReason(e.target.value)}
          />
        </div>

        <Button
          onClick={() => void handleLedgerSubmit()}
          disabled={!ledgerAmount.trim() || Number(ledgerAmount.replace(',', '.')) <= 0}
        >
          {isGoal ? (
            <>
              <Check size={13} /> Mentés
            </>
          ) : (
            <>
              <Plus size={13} /> Rögzítés
            </>
          )}
        </Button>

        <LedgerHistoryPanel items={activeLedgerItems as LedgerEntry[] | undefined} />
      </div>
    </Modal>
  );
}
