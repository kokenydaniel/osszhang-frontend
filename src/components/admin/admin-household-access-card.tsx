'use client';

import classNames from 'classnames';
import { Crown, CreditCard, Gift, Pencil } from 'lucide-react';
import { InsightBanner, StatusPill } from '@/components/design';
import { Button } from '@/components/ui/button';
import { describeHouseholdAccess, formatTierLabel } from '@/helpers/admin-helpers';
import type { AdminHousehold } from '@/types/admin';

type AdminHouseholdAccessCardProps = {
  household: AdminHousehold;
  grantBlockedReason?: string | null;
  onEditGrant?: () => void;
  className?: string;
};

function tierTone(tier: string): 'neutral' | 'info' | 'success' {
  if (tier === 'premium') return 'success';
  if (tier === 'pro') return 'info';
  return 'neutral';
}

export function AdminHouseholdAccessCard({
  household,
  grantBlockedReason = null,
  onEditGrant,
  className,
}: AdminHouseholdAccessCardProps) {
  const access = describeHouseholdAccess(household);
  const grantBlocked = Boolean(grantBlockedReason);

  return (
    <div
      className={classNames(
        'rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.03] overflow-hidden',
        className,
      )}
    >
      <div className="border-b border-border/80 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Mit használnak most
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{access.headline}</h2>
              <StatusPill status={tierTone(access.effectiveTier)} size="xs">
                {formatTierLabel(access.effectiveTier)}
              </StatusPill>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">{access.subline}</p>
          </div>
          {onEditGrant ? (
            <Button
              size="sm"
              className="shrink-0"
              disabled={grantBlocked}
              onClick={onEditGrant}
            >
              <Pencil size={14} />
              Hozzáférési grant
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/80">
        <div className="px-5 py-4 sm:px-6 flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <CreditCard size={16} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Stripe / fizetős csomag</p>
            <p className="text-sm text-muted-foreground mt-0.5">{access.stripeLabel}</p>
            <p className="text-[0.72rem] text-muted-foreground/90 mt-1 leading-relaxed">
              Amit a számlázás és előfizetés rögzít — ettől függetlenül adható admin ajándék.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6 flex gap-3">
          <div
            className={classNames(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              access.grantActive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {access.grantActive ? <Gift size={16} strokeWidth={2.2} /> : <Crown size={16} strokeWidth={2.2} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">Admin ajándék (grant)</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {access.grantLabel}
              {access.grantExpiryLabel ? ` · ${access.grantExpiryLabel}` : ''}
            </p>
            {household.tier_grant_note?.trim() ? (
              <p className="text-[0.72rem] text-muted-foreground mt-1 italic">
                „{household.tier_grant_note.trim()}”
              </p>
            ) : (
              <p className="text-[0.72rem] text-muted-foreground/90 mt-1 leading-relaxed">
                Platform admin által adott extra hozzáférés — nem módosítja a Stripe számlát.
              </p>
            )}
            {onEditGrant && !grantBlocked ? (
              <Button variant="outline" size="xs" className="mt-3" onClick={onEditGrant}>
                Grant módosítása
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {grantBlockedReason ? (
        <div className="border-t border-border/80 px-5 py-3 sm:px-6">
          <InsightBanner tone="warning" title="Grant nem elérhető">
            {grantBlockedReason}
          </InsightBanner>
        </div>
      ) : null}
    </div>
  );
}
