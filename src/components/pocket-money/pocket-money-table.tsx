'use client';

import {
  DataTable,
  EmptyState,
  RowActions,
  type DataTableColumn,
} from '@/components/design';
import { pocketMoneyCalculations, POCKET_MONEY_ENTRY_LABELS } from '@/calculations/pocket-money';
import type { PocketMoneyEntry } from '@/types/pocket-money';
import { DEFAULT_POCKET_MONEY_ICON_ID } from '@/config/pocket-money-icons';
import { findRosterMemberByKey } from '@/settings/pocket-money';
import type { PocketMoneyRosterMember } from '@/types/pocket-money';
import { Coins, Minus, Plus } from 'lucide-react';
import { formatTransactionAmount } from '@/utils/money';
import { PocketMoneyAvatar } from './pocket-money-avatar';

export type PocketMoneyTableProps = {
  entries: PocketMoneyEntry[];
  roster: PocketMoneyRosterMember[];
  exchangeRates: Record<string, number>;
  isReader: boolean;
  onEdit: (entry: PocketMoneyEntry) => void;
  onDelete: (id: number) => void;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
};

export function PocketMoneyTable({
  entries,
  roster,
  exchangeRates,
  isReader,
  onEdit,
  onDelete,
  requestDelete,
}: PocketMoneyTableProps) {
  const columns: DataTableColumn<PocketMoneyEntry>[] = [
    {
      key: 'member',
      header: 'Családtag',
      width: '22%',
      cell: (row) => {
        const rosterMember = findRosterMemberByKey(roster, row.memberUserId, row.memberLabel);
        const iconId = rosterMember?.icon ?? DEFAULT_POCKET_MONEY_ICON_ID;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <PocketMoneyAvatar
              iconId={iconId}
              size="sm"
              stickerColor={rosterMember?.stickerColor}
              iconColor={rosterMember?.iconColor}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{row.memberLabel}</p>
              <p className="text-[0.7rem] text-muted-foreground truncate">{row.entryDate}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Típus',
      width: '18%',
      cell: (row) => (
        <span className="text-sm text-foreground">{POCKET_MONEY_ENTRY_LABELS[row.entryType]}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Összeg',
      width: '16%',
      cell: (row) => {
        const signed = pocketMoneyCalculations.signedAmount(row);
        const isNeg = signed < 0;
        return (
          <span
            className={`text-sm font-semibold tabular-nums inline-flex items-center gap-1 ${
              isNeg ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isNeg ? <Minus size={12} /> : <Plus size={12} />}
            {formatTransactionAmount(Math.abs(row.amount), row.currency, exchangeRates)}
          </span>
        );
      },
    },
    {
      key: 'note',
      header: 'Megjegyzés',
      width: '28%',
      cell: (row) => (
        <span className="text-xs text-muted-foreground truncate block">{row.note || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '10%',
      cell: (row) =>
        isReader ? null : (
          <RowActions
            onEdit={() => onEdit(row)}
            onDelete={() =>
              requestDelete({
                title: 'Tétel törlése',
                message: `Biztosan törlöd: „${row.memberLabel} – ${POCKET_MONEY_ENTRY_LABELS[row.entryType]}"?`,
                onConfirm: () => onDelete(row.id),
              })
            }
          />
        ),
    },
  ];

  return (
    <div className="min-h-[220px]">
      {entries.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <EmptyState
            icon={Coins}
            title="Nincs tétel"
            description="Ebben a szűrésben nincs mozgás. Válassz másik családtagot, vagy add hozzá az első tételt."
          />
        </div>
      ) : (
        <DataTable columns={columns} data={entries} rowKey={(row) => String(row.id)} />
      )}
    </div>
  );
}
