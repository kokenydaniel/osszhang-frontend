'use client';

import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/design/StatusPill';
import { ObjectDetails } from '@/components/design/ObjectDetails';
import { AdminService } from '@/services/AdminService';
import { formatDate } from '@/utils';
import { formatDisplayName } from '@/lib/personName';
import type { AdminUser } from '@/types/admin';

interface AdminUserDetailPanelProps {
  user: AdminUser;
  canManage: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onImpersonate: () => void;
}

function buildDetailItems(user: AdminUser) {
  const items = [
    { label: 'Háztartás', value: user.householdName?.trim() || '—' },
  ];

  if (user.businessName?.trim()) {
    items.push({ label: 'Vállalkozás', value: user.businessName.trim() });
  }

  items.push({
    label: 'Háztartás csomag',
    value: AdminService.formatTierLabel(user.effectiveTier),
  });

  if (user.householdSubscriptionTier !== user.effectiveTier) {
    items.push({
      label: 'Fizetős előfizetés',
      value: AdminService.formatTierLabel(user.householdSubscriptionTier),
    });
  }

  items.push(
    { label: 'Háztartás szerep', value: AdminService.formatHouseholdRole(user.role) },
    { label: 'Utolsó belépés', value: user.lastLoginAt ? formatDate(user.lastLoginAt) : '—' },
    { label: 'Regisztráció', value: user.createdAt ? formatDate(user.createdAt) : '—' },
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
}: AdminUserDetailPanelProps) {
  const displayName = formatDisplayName(user.firstName, user.lastName) || user.username;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
        <p className="text-sm text-muted-foreground mt-1">@{user.username}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <StatusPill status={user.isActive ? 'success' : 'danger'} size="xs">
            {user.isActive ? 'Aktív' : 'Inaktív'}
          </StatusPill>
          {user.lifetimeAdmin ? (
            <StatusPill status="warning" size="xs">
              Platform admin
            </StatusPill>
          ) : null}
          <StatusPill status="info" size="xs">
            {AdminService.formatTierLabel(user.effectiveTier)}
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
          {user.isActive ? (
            <Button variant="outline" onClick={onDeactivate}>
              Inaktiválás
            </Button>
          ) : (
            <Button variant="outline" onClick={onActivate}>
              Aktiválás
            </Button>
          )}
          {user.isActive ? (
            <Button onClick={onImpersonate}>Megszemélyesítés</Button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground border-t border-border pt-4">
          {user.lifetimeAdmin
            ? 'Platform admin fiókokat nem lehet kezelni.'
            : 'Saját fiókodat nem kezelheted innen.'}
        </p>
      )}
    </div>
  );
}
