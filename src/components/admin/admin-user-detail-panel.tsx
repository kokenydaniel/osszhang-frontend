'use client';

import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/design/StatusPill';
import { ObjectDetails } from '@/components/design/ObjectDetails';
import { formatTierLabel, formatHouseholdRole } from '@/helpers/admin-helpers';
import { formatDate } from '@/utils';
import { formatDisplayName } from '@/utils/person-name';
import type { AdminUser } from '@/types/admin';

interface AdminUserDetailPanelProps {
  user: AdminUser;
  canManage: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onImpersonate: () => void;
  onEditTierGrant: () => void;
}

function buildDetailItems(user: AdminUser) {
  const items = [
    { label: 'Háztartás', value: user.household_name?.trim() || '—' },
  ];

  if (user.business_name?.trim()) {
    items.push({ label: 'Vállalkozás', value: user.business_name.trim() });
  }

  const billingTier = user.billing_tier ?? user.household_subscription_tier;

  items.push({
    label: 'Fizetős előfizetés (Stripe)',
    value: formatTierLabel(billingTier),
  });

  items.push({
    label: 'Effektív hozzáférés',
    value: formatTierLabel(user.effective_tier),
  });

  if (user.tier_grant_active && user.tier_grant) {
    const expiry = user.tier_grant_is_permanent
      ? 'örökös'
      : user.tier_grant_expires_at
        ? formatDate(user.tier_grant_expires_at)
        : '—';
    items.push({
      label: 'Admin grant',
      value: `${formatTierLabel(user.tier_grant)} · ${expiry}`,
    });
  }

  if (user.tier_grant_note?.trim()) {
    items.push({ label: 'Grant megjegyzés', value: user.tier_grant_note.trim() });
  }

  items.push(
    { label: 'Háztartás szerep', value: formatHouseholdRole(user.role) },
    { label: 'Utolsó belépés', value: user.last_login_at ? formatDate(user.last_login_at) : '—' },
    { label: 'Regisztráció', value: user.created_at ? formatDate(user.created_at) : '—' },
    { label: 'Felhasználó ID', value: String(user.id) },
  );

  return items;
}

export function AdminUserDetailPanel({
  user,
  canManage,
  onActivate,
  onDeactivate,
  onImpersonate,
  onEditTierGrant,
}: AdminUserDetailPanelProps) {
  const displayName = formatDisplayName(user.first_name, user.last_name) || user.username;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
        <p className="text-sm text-muted-foreground mt-1">@{user.username}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <StatusPill status={user.is_active ? 'success' : 'danger'} size="xs">
            {user.is_active ? 'Aktív' : 'Inaktív'}
          </StatusPill>
          {user.lifetime_admin ? (
            <StatusPill status="warning" size="xs">
              Platform admin
            </StatusPill>
          ) : null}
          <StatusPill status="info" size="xs">
            {formatTierLabel(user.effective_tier)}
          </StatusPill>
        </div>
      </div>

      <ObjectDetails
        groups={[
          {
            items: buildDetailItems(user),
          },
        ]}
      />

      {canManage ? (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          {user.is_active ? (
            <Button variant="outline" onClick={onDeactivate}>
              Inaktiválás
            </Button>
          ) : (
            <Button variant="outline" onClick={onActivate}>
              Aktiválás
            </Button>
          )}
          {user.is_active ? (
            <Button onClick={onImpersonate}>Megszemélyesítés</Button>
          ) : null}
          <Button variant="outline" onClick={onEditTierGrant}>
            Hozzáférési grant
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground border-t border-border pt-4">
          {user.lifetime_admin
            ? 'Platform admin fiókokat nem lehet kezelni.'
            : 'Saját fiókodat nem kezelheted innen.'}
        </p>
      )}
    </div>
  );
}
