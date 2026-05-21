'use client';

import classNames from 'classnames';
import { motion } from 'motion/react';
import { Sparkles, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/design';
import { formatHUF, formatDate } from '@/utils';
import { Investment } from '@/types';
import type { SavingsPageState } from '@/components/modules/savings/hooks/use-savings-page-state';

type SavingsInvestmentCardProps = Pick<
  SavingsPageState,
  | 'getInvestmentValue'
  | 'getMaturityAmount'
  | 'updateInvestment'
  | 'deleteInvestment'
  | 'requestDelete'
  | 'editingInvId'
  | 'editingInvValue'
  | 'setEditingInvValue'
  | 'editingPayoutInvId'
  | 'setEditingPayoutInvId'
  | 'editingPayoutAmount'
  | 'setEditingPayoutAmount'
  | 'editingPayoutDate'
  | 'setEditingPayoutDate'
  | 'startEditInvestmentValue'
  | 'saveInvestmentValue'
  | 'cancelEditInvestmentValue'
  | 'saveInvestmentPayout'
> & {
  inv: Investment;
};

export function SavingsInvestmentCard({
  inv,
  getInvestmentValue,
  getMaturityAmount,
  updateInvestment,
  deleteInvestment,
  requestDelete,
  editingInvId,
  editingInvValue,
  setEditingInvValue,
  editingPayoutInvId,
  setEditingPayoutInvId,
  editingPayoutAmount,
  setEditingPayoutAmount,
  editingPayoutDate,
  setEditingPayoutDate,
  startEditInvestmentValue,
  saveInvestmentValue,
  cancelEditInvestmentValue,
  saveInvestmentPayout,
}: SavingsInvestmentCardProps) {
  const { totalValue, accruedInterest, daysPassed } = getInvestmentValue(inv);
  const inactive = inv.countInSavings === false;
  const mAmount = getMaturityAmount(inv);
  const isEditingValue = editingInvId === inv.id;
  const isEditingPayout = editingPayoutInvId === inv.id;

  return (
    <motion.div
      layout={false}
      whileHover={{ y: -2 }}
      className={classNames(
        'rounded-lg border border-border bg-card p-5 flex flex-col gap-4 transition-shadow shadow-soft hover:shadow-lift',
        inactive && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
            <Sparkles size={15} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground tracking-tight truncate">{inv.name}</p>
            <p className="text-xs text-muted-foreground">
              {inv.owner} · {inv.type === 'bond' ? 'Állampapír' : inv.type}
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            requestDelete({
              title: 'Befektetés törlése',
              message: `Biztosan törlöd a „${inv.name}" befektetést? Ez a művelet nem vonható vissza.`,
              onConfirm: () => deleteInvestment(inv.id),
            })
          }
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            {isEditingValue ? 'Új érték (Ft)' : 'Aktuális érték'}
          </span>
          {!isEditingValue && (
            <button
              onClick={() => startEditInvestmentValue(inv, totalValue)}
              className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Pencil size={9} /> Szerkeszt
            </button>
          )}
        </div>
        {isEditingValue ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={editingInvValue}
              onChange={(e) => setEditingInvValue(e.target.value)}
              autoFocus
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveInvestmentValue(inv.id);
                } else if (e.key === 'Escape') {
                  cancelEditInvestmentValue();
                }
              }}
            />
            <Button size="xs" onClick={() => saveInvestmentValue(inv.id)}>
              OK
            </Button>
            <Button variant="ghost" size="xs" onClick={cancelEditInvestmentValue} aria-label="Mégse">
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-emerald-600 tabular-nums tracking-tight leading-none">
              {formatHUF(totalValue)}
            </p>
            {inv.currentValue ? (
              <StatusPill status="success" size="xs">MÁK valós</StatusPill>
            ) : (
              <StatusPill status="neutral" size="xs">Becsült</StatusPill>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-xs">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Tőke</p>
          <p className="text-foreground tabular-nums mt-0.5">{formatHUF(inv.principalAmount)}</p>
        </div>
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Éves kamat</p>
          <p className="text-foreground tabular-nums mt-0.5">{inv.annualInterestRate}%</p>
        </div>
        {mAmount && (
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Lejáratkor</p>
            <p className="text-amber-700 tabular-nums mt-0.5">{formatHUF(mAmount)}</p>
          </div>
        )}
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            Hozam ({daysPassed} nap)
          </p>
          <p className={classNames('tabular-nums mt-0.5', accruedInterest >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {accruedInterest >= 0 ? '+' : ''}
            {formatHUF(accruedInterest)}
          </p>
        </div>
      </div>

      {isEditingPayout && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-2">
          <Input
            type="number"
            value={editingPayoutAmount}
            onChange={(e) => setEditingPayoutAmount(e.target.value)}
            placeholder="Összeg"
            className="h-8 text-xs"
          />
          <Input
            type="date"
            value={editingPayoutDate}
            onChange={(e) => setEditingPayoutDate(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="xs" onClick={() => saveInvestmentPayout(inv.id)} className="flex-1">
              Mentés
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setEditingPayoutInvId(null)} className="flex-1">
              Mégse
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <label className="inline-flex items-center gap-2 text-xs text-foreground">
          <button
            type="button"
            onClick={() => updateInvestment(inv.id, { countInSavings: !inv.countInSavings })}
            className={classNames(
              'relative h-4 w-7 rounded-full transition-colors',
              inv.countInSavings !== false ? 'bg-emerald-500' : 'bg-muted-foreground/30',
            )}
          >
            <span
              className={classNames(
                'absolute top-0.5 h-3 w-3 rounded-full bg-card transition-all',
                inv.countInSavings !== false ? 'left-[14px]' : 'left-0.5',
              )}
            />
          </button>
          <span title="Beleszámít a fő vagyon összegébe a Széf nézetben">Vagyonba</span>
        </label>
        <span className="text-[0.65rem] text-muted-foreground tabular-nums">
          {formatDate(inv.purchaseDate)}
          {inv.maturityDate && ` → ${formatDate(inv.maturityDate)}`}
        </span>
      </div>
    </motion.div>
  );
}
