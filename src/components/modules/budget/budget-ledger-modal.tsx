'use client';

import { LedgerEntry } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { LedgerHistoryPanel } from '@/components/design';
import { HELP } from '@/lib/helpTexts';
import { Check, Plus } from 'lucide-react';
import { useBudgetLogic } from '@/components/modules/budget/BudgetLogicContext';

export function BudgetLedgerModal() {
  const logic = useBudgetLogic();
  const isGoal = logic.ledgerIsGoalPayment;

  return (
    <Modal
      isOpen={logic.isLedgerModalOpen}
      onClose={logic.closeLedgerModal}
      title={isGoal ? `Befizetés: ${logic.ledgerGoalTitle}` : 'Költés rögzítése (ledger)'}
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
            value={logic.ledgerAmount}
            onChange={(e) => logic.setLedgerAmount({ type: 'SET_LEDGER_FIELD', field: 'ledgerAmount', value: e.target.value } as any)}
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
            value={logic.ledgerReason}
            onChange={(e) => logic.setLedgerReason({ type: 'SET_LEDGER_FIELD', field: 'ledgerReason', value: e.target.value } as any)}
          />
        </div>

        <Button
          onClick={() => void logic.handleLedgerSubmit()}
          loading={logic.ledgerSaving}
          disabled={
            logic.ledgerSaving ||
            !logic.ledgerAmount.trim() ||
            Number(logic.ledgerAmount.replace(',', '.')) <= 0
          }
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

        <LedgerHistoryPanel items={logic.activeLedgerItems as LedgerEntry[] | undefined} />
      </div>
    </Modal>
  );
}
