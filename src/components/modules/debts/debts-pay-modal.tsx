'use client';

import { formatHUF } from '@/utils';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
import { Banknote, RefreshCw, Wallet } from 'lucide-react';
import type { DebtsPageState } from '@/components/modules/debts/hooks/use-debts-page-state';

type DebtsPayModalProps = Pick<
  DebtsPageState,
  | 'isPayModalOpen'
  | 'setIsPayModalOpen'
  | 'payDebt'
  | 'payAmount'
  | 'setPayAmount'
  | 'payDate'
  | 'setPayDate'
  | 'payNote'
  | 'setPayNote'
  | 'payAddToBudget'
  | 'setPayAddToBudget'
  | 'payCategory'
  | 'setPayCategory'
  | 'paySaving'
  | 'handlePaySubmit'
  | 'categories'
  | 'selectedYear'
  | 'selectedMonth'
>;

export function DebtsPayModal({
  isPayModalOpen,
  setIsPayModalOpen,
  payDebt,
  payAmount,
  setPayAmount,
  payDate,
  setPayDate,
  payNote,
  setPayNote,
  payAddToBudget,
  setPayAddToBudget,
  payCategory,
  setPayCategory,
  paySaving,
  handlePaySubmit,
  categories,
  selectedYear,
  selectedMonth,
}: DebtsPayModalProps) {
  return (
    <Modal
      isOpen={isPayModalOpen}
      onClose={() => setIsPayModalOpen(false)}
      title="Törlesztés rögzítése"
      description={
        payDebt
          ? `${payDebt.name} · ${formatHUF(Math.max(0, Number(payDebt.targetAmount) - Number(payDebt.paidAmount)))} van hátra`
          : ''
      }
    >
      <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.debts.payAmount}>Összeg (Ft)</FieldLabel>
            <Input
              type="number"
              step="any"
              placeholder="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
            />
            {payDebt?.minimumPayment && Number(payAmount) > 0 && Number(payAmount) !== Number(payDebt.minimumPayment) && (
              <p className="text-[0.7rem] text-muted-foreground">
                Eltér a havi részlettől ({formatHUF(payDebt.minimumPayment)})
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.debts.payDate}>Dátum</FieldLabel>
            <DatePicker value={payDate} onChange={setPayDate} />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.payNote}>Megjegyzés</FieldLabel>
          <Input
            placeholder="pl. Júniusi részlet"
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
          />
        </div>

        <div className="rounded-md border border-border bg-gradient-to-br from-primary/[0.04] to-card p-3.5 space-y-3">
          <p className="text-[0.72rem] text-muted-foreground leading-snug">
            {HELP.debts.payBudget}
          </p>
          <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={payAddToBudget}
              onChange={(e) => setPayAddToBudget(e.target.checked)}
            />
            <span className="inline-flex items-center gap-1.5">
              <Wallet size={14} className="text-primary" />
              <span className="font-medium">Költségvetésbe is rögzítem</span>
              <InfoTooltip content={HELP.debts.payBudget} />
            </span>
          </label>
          {payAddToBudget && (
            <div className="space-y-1.5 pl-7">
              <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.debts.payCategory}>
                Kategória
              </FieldLabel>
              {categories.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                  Még nincs kategória. Hozz létre egyet a Beállításokban.
                </p>
              ) : (
                <select
                  className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                  value={payCategory}
                  onChange={(e) => setPayCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[0.7rem] text-muted-foreground">
                Egy „kifizetve" státuszú kiadás-tételt rögzít a {selectedYear}.{' '}
                {String(selectedMonth).padStart(2, '0')}. hónapra.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setIsPayModalOpen(false)}
            disabled={paySaving}
          >
            Mégse
          </Button>
          <Button type="submit" className="flex-1" disabled={paySaving}>
            {paySaving ? <RefreshCw size={13} className="animate-spin" /> : <Banknote size={13} />}
            Befizetés rögzítése
          </Button>
        </div>
      </form>
    </Modal>
  );
}
