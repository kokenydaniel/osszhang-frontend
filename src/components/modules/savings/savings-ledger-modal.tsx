'use client';

import classNames from 'classnames';
import { formatDate } from '@/utils';
import { LedgerEntry } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { SegmentedControl } from '@/components/design';
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
        <div className="border-t border-border pt-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Korábbi tételek
          </p>
          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
            {ledgerItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Még nincsenek tételek.</p>
            ) : (
              ledgerItems
                .slice()
                .reverse()
                .map((item: LedgerEntry) => (
                  <div
                    key={item.id}
                    className={classNames(
                      'flex items-center gap-2 bg-muted/40 border rounded-md px-3 py-2',
                      editingLedgerId === item.id ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.reason}</p>
                      <p className="text-[0.7rem] text-muted-foreground tabular-nums">{formatDate(item.date)}</p>
                    </div>
                    <p
                      className={classNames(
                        'text-sm font-semibold tabular-nums shrink-0',
                        item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {item.amount >= 0 ? '+' : ''}
                      {formatCurrencyAmount(item.amount, ledgerCurrency)}
                    </p>
                    <div className="flex shrink-0 gap-0.5">
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
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
