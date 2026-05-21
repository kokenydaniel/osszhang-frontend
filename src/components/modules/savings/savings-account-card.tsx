'use client';

import classNames from 'classnames';
import { motion } from 'motion/react';
import { Wallet, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatHUF } from '@/utils';
import type { SavingsPageState } from '@/components/modules/savings/hooks/use-savings-page-state';

type SavingsAccountCardProps = Pick<
  SavingsPageState,
  | 'convertToHUF'
  | 'formatCurrencyAmount'
  | 'updateSavingsAccount'
  | 'deleteSavingsAccount'
  | 'requestDelete'
  | 'openLedgerModal'
> & {
  acc: SavingsPageState['savings'][number];
  accent: 'primary' | 'rose';
};

export function SavingsAccountCard({
  acc,
  accent,
  convertToHUF,
  formatCurrencyAmount,
  updateSavingsAccount,
  deleteSavingsAccount,
  requestDelete,
  openLedgerModal,
}: SavingsAccountCardProps) {
  const balance = acc.ledger.reduce((s, l) => s + l.amount, 0);
  const inactive = acc.count_in_savings === false;

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
          <div
            className={classNames(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md shadow-sm',
              accent === 'primary'
                ? 'bg-gradient-to-br from-primary to-violet-500 text-primary-foreground'
                : 'bg-gradient-to-br from-rose-400 to-pink-500 text-white',
            )}
          >
            <Wallet size={15} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground tracking-tight truncate">{acc.institution}</p>
            <p className="text-xs text-muted-foreground">
              {acc.owner} · {acc.currency}
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            requestDelete({
              title: 'Számla törlése',
              message: `Biztosan törlöd a „${acc.institution}" számlát és az összes mozgást? Ez a művelet nem vonható vissza.`,
              onConfirm: () => deleteSavingsAccount(acc.id),
            })
          }
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div>
        <p
          className={classNames(
            'text-2xl font-semibold tracking-tight tabular-nums leading-none',
            accent === 'primary' ? 'text-primary' : 'text-rose-600',
          )}
        >
          {formatCurrencyAmount(balance, acc.currency)}
        </p>
        {acc.currency !== 'HUF' && (
          <p className="text-[0.7rem] text-muted-foreground mt-1.5 tabular-nums">
            ≈ {formatHUF(convertToHUF(balance, acc.currency))}{' '}
            <span className="opacity-60">(árfolyamon)</span>
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <button
            type="button"
            onClick={() => updateSavingsAccount(acc.id, { count_in_savings: !acc.count_in_savings })}
            className={classNames(
              'relative h-4 w-7 rounded-full transition-colors',
              acc.count_in_savings !== false ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
          >
            <span
              className={classNames(
                'absolute top-0.5 h-3 w-3 rounded-full bg-card transition-all',
                acc.count_in_savings !== false ? 'left-[14px]' : 'left-0.5',
              )}
            />
          </button>
          <span title="Beleszámít a fő vagyon összegébe a Széf nézetben">Vagyonba</span>
        </label>
        <Button variant="ghost" size="xs" onClick={() => openLedgerModal(acc.id)}>
          <History size={12} /> Történet
        </Button>
      </div>
    </motion.div>
  );
}
