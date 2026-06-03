'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { motion } from 'motion/react';
import { Sparkles, Trash2, Pencil, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusPill, MiniSwitch, ObjectDetails, type DetailGroup } from '@/components/design';
import { formatHUF, formatDate } from '@/utils';
import { canEditHousehold } from '@/utils/household-role';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Investment } from '@/types';

type SavingsInvestmentCardProps = {
  inv: Investment;
  getInvestmentValue: (inv: Investment) => {
    totalValue: number;
    accruedInterest: number;
    daysPassed: number;
  };
  getMaturityAmount: (inv: Investment) => number | null;
  updateInvestment: (id: number, data: Partial<Omit<Investment, 'id'>>) => Promise<void>;
  deleteInvestment: (id: number) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
  onEditDetails?: (inv: Investment) => void;
  isReader: boolean;
};

export function SavingsInvestmentCard({
  inv,
  getInvestmentValue,
  getMaturityAmount,
  updateInvestment,
  deleteInvestment,
  requestDelete,
  onEditDetails,
  isReader,
}: SavingsInvestmentCardProps) {
  const [editingValue, setEditingValue] = useState(false);
  const [valueInput, setValueInput] = useState('');
  const [editingPayout, setEditingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDate, setPayoutDate] = useState('');

  const { totalValue, accruedInterest, daysPassed } = getInvestmentValue(inv);
  const inactive = inv.countInSavings === false;
  const mAmount = getMaturityAmount(inv);

  const startEditValue = () => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;
    setValueInput(
      inv.currentValue ? String(inv.currentValue) : String(Math.round(totalValue)),
    );
    setEditingValue(true);
  };

  const saveValue = () => {
    void updateInvestment(inv.id, { currentValue: Number(valueInput) });
    setEditingValue(false);
  };

  const savePayout = () => {
    void updateInvestment(inv.id, {
      nextPayoutAmount: Number(payoutAmount),
      nextPayoutDate: payoutDate || null,
    });
    setEditingPayout(false);
  };

  const detailGroups: DetailGroup[] = [
    {
      items: [
        { label: 'Tőke', value: formatHUF(inv.principalAmount) },
        { label: 'Éves kamat', value: `${inv.annualInterestRate}%` },
        ...(mAmount
          ? [{ label: 'Lejáratkor', value: <span className="text-amber-700">{formatHUF(mAmount)}</span> }]
          : []),
        {
          label: `Hozam (${daysPassed} nap)`,
          value: (
            <span className={accruedInterest >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {accruedInterest >= 0 ? '+' : ''}
              {formatHUF(accruedInterest)}
            </span>
          ),
        },
      ],
    },
  ];

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
        {!isReader ? (
          <div className="flex shrink-0 items-center gap-0.5">
            {onEditDetails ? (
              <button
                type="button"
                onClick={() => onEditDetails(inv)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Részletes szerkesztés"
              >
                <Settings2 size={13} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                requestDelete({
                  title: 'Befektetés törlése',
                  message: `Biztosan törlöd a „${inv.name}" befektetést? Ez a művelet nem vonható vissza.`,
                  onConfirm: () => deleteInvestment(inv.id),
                })
              }
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              aria-label="Törlés"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            {editingValue ? 'Új érték (Ft)' : 'Aktuális érték'}
          </span>
          {!editingValue && !isReader ? (
            <button
              onClick={startEditValue}
              className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Pencil size={9} /> Szerkeszt
            </button>
          ) : null}
        </div>
        {editingValue ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              autoFocus
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveValue();
                else if (e.key === 'Escape') setEditingValue(false);
              }}
            />
            <Button size="xs" onClick={saveValue}>
              OK
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setEditingValue(false)} aria-label="Mégse">
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-emerald-600 tabular-nums tracking-tight leading-none">
              {formatHUF(totalValue)}
            </p>
            {inv.currentValue ? (
              <StatusPill status="success" size="xs">
                MÁK valós
              </StatusPill>
            ) : (
              <StatusPill status="neutral" size="xs">
                Becsült
              </StatusPill>
            )}
          </div>
        )}
      </div>

      <ObjectDetails groups={detailGroups} columns={2} compact className="pt-3 border-t border-border" />

      {editingPayout ? (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-2">
          <Input
            type="number"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="Összeg"
            className="h-8 text-xs"
          />
          <Input
            type="date"
            value={payoutDate}
            onChange={(e) => setPayoutDate(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="xs" onClick={savePayout} className="flex-1">
              Mentés
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setEditingPayout(false)} className="flex-1">
              Mégse
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <MiniSwitch
          checked={inv.countInSavings !== false}
          onChange={(checked) => void updateInvestment(inv.id, { countInSavings: checked })}
          label="Vagyonba"
          title="Beleszámít a fő vagyon összegébe a Széf nézetben"
          tone="success"
          disabled={isReader}
        />
        <span className="text-[0.65rem] text-muted-foreground tabular-nums">
          {formatDate(inv.purchaseDate)}
          {inv.maturityDate && ` → ${formatDate(inv.maturityDate)}`}
        </span>
      </div>
    </motion.div>
  );
}
