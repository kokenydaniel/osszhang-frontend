'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pocketMoneyCalculations } from '@/calculations/pocket-money';
import type { PocketMoneyDisplayMember } from '@/types/pocket-money';
import { PocketMoneyAvatar } from './pocket-money-avatar';

type PocketMoneyMemberCardProps = {
  member: PocketMoneyDisplayMember;
  active: boolean;
  canEdit?: boolean;
  onSelect: () => void;
  onEdit?: () => void;
};

export function PocketMoneyMemberCard({
  member,
  active,
  canEdit,
  onSelect,
  onEdit,
}: PocketMoneyMemberCardProps) {
  const m = member;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 transition-all duration-300 ${
        active
          ? 'border-primary/50 bg-gradient-to-br from-primary/[0.06] via-card to-violet-500/[0.04] shadow-lg shadow-primary/10'
          : 'border-border/80 bg-card hover:border-primary/25 hover:shadow-md'
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-primary/15 to-violet-400/10 blur-2xl opacity-80 group-hover:opacity-100 transition-opacity"
      />

      <button
        type="button"
        onClick={onSelect}
        className="relative z-10 flex w-full flex-1 gap-4 p-5 pb-4 text-left"
      >
        <div className="min-w-0 flex-1 space-y-2.5">
          <h3 className="text-base font-bold tracking-tight text-foreground truncate pr-1">{m.memberLabel}</h3>
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Egyenleg (összesen)
          </p>
          <p
            className={`text-3xl font-extrabold tabular-nums leading-none tracking-tight ${
              m.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
            }`}
          >
            {pocketMoneyCalculations.formatAmount(m.balance, m.currency)}
          </p>
          <p className="text-[0.65rem] text-muted-foreground">
            Hónap elején: {pocketMoneyCalculations.formatAmount(m.openingBalance, m.currency)}
          </p>
          <ul className="text-[0.7rem] text-muted-foreground space-y-0.5 leading-snug pt-1 border-t border-border/50">
            <li className="text-[0.6rem] uppercase tracking-wide text-muted-foreground/80 pt-0.5">
              Ebben a hónapban
            </li>
            <li>Kiosztva: {pocketMoneyCalculations.formatAmount(m.allowanceTotal, m.currency)}</li>
            <li>Elköltve: {pocketMoneyCalculations.formatAmount(m.expenseTotal, m.currency)}</li>
            {m.adjustmentTotal > 0 ? (
              <li>Korrekció: {pocketMoneyCalculations.formatAmount(m.adjustmentTotal, m.currency)}</li>
            ) : null}
            {m.interestTotal > 0 ? (
              <li className="text-violet-600 dark:text-violet-400">
                Kamat: {pocketMoneyCalculations.formatAmount(m.interestTotal, m.currency)}
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-start pt-0.5">
          <PocketMoneyAvatar
            iconId={m.icon}
            variant="sticker"
            active={active}
            stickerColor={m.stickerColor}
            iconColor={m.iconColor}
          />
        </div>
      </button>

      {canEdit && onEdit ? (
        <div className="relative z-10 flex items-center justify-end border-t border-border/50 bg-muted/30 px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil size={13} />
            Szerkesztés
          </Button>
        </div>
      ) : null}
    </article>
  );
}
