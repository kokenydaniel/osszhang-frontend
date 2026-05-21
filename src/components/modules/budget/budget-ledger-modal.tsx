'use client';

import classNames from 'classnames';
import { formatHUF, formatDate } from '@/utils';
import { LedgerEntry } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
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

        <div className="border-t border-border pt-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Korábbi tételek
          </p>
          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
            {!activeLedgerItems || activeLedgerItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Még nincsenek tételek.</p>
            ) : (
              activeLedgerItems
                .slice()
                .reverse()
                .map((item: LedgerEntry) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-muted/40 border border-border rounded-md px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.reason}</p>
                      <p className="text-[0.7rem] text-muted-foreground tabular-nums">{formatDate(item.date)}</p>
                    </div>
                    <p
                      className={classNames(
                        'text-sm font-semibold tabular-nums',
                        item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {item.amount >= 0 ? '+' : ''}
                      {formatHUF(item.amount)}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
