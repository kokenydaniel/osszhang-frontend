'use client';

import classNames from 'classnames';
import { Wallet, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetCard, MiniSwitch } from '@/components/design';
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
  | 'isReader'
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
  isReader,
}: SavingsAccountCardProps) {
  const balance = acc.ledger.reduce((s, l) => s + l.amount, 0);
  const inactive = acc.count_in_savings === false;

  return (
    <AssetCard
      icon={Wallet}
      iconClassName={
        accent === 'primary'
          ? 'bg-gradient-to-br from-primary to-violet-500 text-primary-foreground'
          : 'bg-gradient-to-br from-rose-400 to-pink-500 text-white'
      }
      title={acc.institution}
      subtitle={`${acc.owner} · ${acc.currency}`}
      inactive={inactive}
      onDelete={
        isReader
          ? undefined
          : () =>
              requestDelete({
                title: 'Számla törlése',
                message: `Biztosan törlöd a „${acc.institution}" számlát és az összes mozgást? Ez a művelet nem vonható vissza.`,
                onConfirm: () => deleteSavingsAccount(acc.id),
              })
      }
      value={
        <>
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
        </>
      }
      footer={
        <>
          <MiniSwitch
            checked={acc.count_in_savings !== false}
            onChange={(checked) => updateSavingsAccount(acc.id, { count_in_savings: checked })}
            label="Vagyonba"
            title="Beleszámít a fő vagyon összegébe a Széf nézetben"
            disabled={isReader}
          />
          <Button variant="ghost" size="xs" onClick={() => openLedgerModal(acc.id)}>
            <History size={12} /> Történet
          </Button>
        </>
      }
    />
  );
}
