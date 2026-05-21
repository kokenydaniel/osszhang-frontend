'use client';

import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { SegmentedControl, LedgerHistoryPanel } from '@/components/design';
import {
  Plus,
  Trash2,
  Pencil,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { SavingsPageState } from '@/components/modules/savings/hooks/use-savings-page-state';

type SavingsLedgerModalProps = Pick<
  SavingsPageState,
  | 'isLedgerModalOpen'
  | 'closeLedgerModal'
  | 'ledgerType'
  | 'setLedgerType'
  | 'ledgerAmount'
  | 'setLedgerAmount'
  | 'ledgerReason'
  | 'setLedgerReason'
  | 'ledgerDate'
  | 'setLedgerDate'
  | 'editingLedgerId'
  | 'clearLedgerForm'
  | 'startEditLedger'
  | 'handleLedgerSubmit'
  | 'handleDeleteLedgerEntry'
  | 'formatCurrencyAmount'
  | 'ledgerCurrency'
  | 'ledgerItems'
>;

export function SavingsLedgerModal({
  isLedgerModalOpen,
  closeLedgerModal,
  ledgerType,
  setLedgerType,
  ledgerAmount,
  setLedgerAmount,
  ledgerReason,
  setLedgerReason,
  ledgerDate,
  setLedgerDate,
  editingLedgerId,
  clearLedgerForm,
  startEditLedger,
  handleLedgerSubmit,
  handleDeleteLedgerEntry,
  formatCurrencyAmount,
  ledgerCurrency,
  ledgerItems,
}: SavingsLedgerModalProps) {
  return (
    <Modal
      isOpen={isLedgerModalOpen}
      onClose={closeLedgerModal}
      title="Számla történet"
      description={
        editingLedgerId
          ? 'Tétel szerkesztése — módosítsd az adatokat, majd mentsd.'
          : 'Új mozgás rögzítése vagy korábbi tétel javítása.'
      }
      contentKey={`${ledgerType}-${editingLedgerId ?? 'new'}`}
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          variant="choice"
          value={ledgerType}
          onChange={(v) => setLedgerType(v as 'deposit' | 'withdraw')}
          options={[
            {
              value: 'deposit',
              label: 'Befizetés',
              icon: ArrowUpRight,
              tone: 'positive',
              description: 'Növeli az egyenleget',
            },
            {
              value: 'withdraw',
              label: 'Kivétel',
              icon: ArrowDownRight,
              tone: 'negative',
              description: 'Csökkenti az egyenleget',
            },
          ]}
          animated={false}
        />
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.historyAmount}>Összeg</FieldLabel>
          <Input
            type="number"
            placeholder="0"
            value={ledgerAmount}
            onChange={(e) => setLedgerAmount(e.target.value)}
            step="any"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.historyNote}>Megjegyzés</FieldLabel>
          <Input
            placeholder="pl. Utalás a közösbe"
            value={ledgerReason}
            onChange={(e) => setLedgerReason(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Dátum</FieldLabel>
          <DatePicker value={ledgerDate} onChange={setLedgerDate} />
        </div>
        <div className="flex gap-2">
          {editingLedgerId && (
            <Button type="button" variant="outline" className="flex-1" onClick={clearLedgerForm}>
              Mégse
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!ledgerAmount.trim() || !ledgerReason.trim()}
            onClick={() => void handleLedgerSubmit()}
          >
            {editingLedgerId ? (
              <>
                <Pencil size={13} /> Mentés
              </>
            ) : (
              <>
                <Plus size={13} /> Rögzítés
              </>
            )}
          </Button>
        </div>
        <LedgerHistoryPanel
          items={ledgerItems}
          editingId={editingLedgerId}
          formatAmount={(amount) => formatCurrencyAmount(amount, ledgerCurrency)}
          actions={(item) => (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Szerkesztés"
                onClick={() => startEditLedger(item)}
              >
                <Edit3 size={13} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Törlés"
                onClick={() => handleDeleteLedgerEntry(item, ledgerCurrency)}
              >
                <Trash2 size={13} />
              </Button>
            </>
          )}
        />
      </div>
    </Modal>
  );
}
