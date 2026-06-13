'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Layers,
  Plug,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import {
  InsightBanner,
  MetricStrip,
  PageHeader,
  SectionPanel,
  StatusPill,
} from '@/components/design';
import { Button } from '@/components/ui/button';
import { useAdminHouseholdDetailPageData } from '@/hooks/useAdminHouseholdDetailPageData';
import {
  ADMIN_INTEGRATION_LABELS,
  ADMIN_MODULE_LABELS,
  describeHouseholdAccess,
  formatTierLabel,
  householdGrantBlockedReason,
} from '@/helpers/admin-helpers';
import { formatDate } from '@/utils';
import type { AdminHouseholdMember, AdminTierGrantPayload } from '@/types/admin';
import { AdminHouseholdAccessCard } from './admin-household-access-card';
import { AdminHouseholdMembersTable } from './admin-household-members-table';
import { AdminActivateModal } from './admin-activate-modal';
import { AdminDeactivateModal } from './admin-deactivate-modal';
import { AdminImpersonateModal } from './admin-impersonate-modal';
import { AdminTierGrantModal } from './admin-tier-grant-modal';
import { AdminDeleteHouseholdModal } from './admin-delete-household-modal';
import { AdminResetPasswordModal } from './admin-reset-password-modal';
import { AdminHouseholdAiUsagePanel } from './admin-household-ai-usage-panel';

type AdminHouseholdDetailPageProps = {
  householdId: number;
};

function FactCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-[0.72rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AdminHouseholdDetailPage({ householdId }: AdminHouseholdDetailPageProps) {
  const data = useAdminHouseholdDetailPageData(householdId);
  const [grantOpen, setGrantOpen] = useState(false);
  const [activateTarget, setActivateTarget] = useState<AdminHouseholdMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminHouseholdMember | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<AdminHouseholdMember | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AdminHouseholdMember | null>(null);

  const household = data.household;

  const handleGrant = useCallback(
    async (payload: AdminTierGrantPayload) => {
      const ok = await data.updateTierGrant(payload);
      if (ok) setGrantOpen(false);
    },
    [data],
  );

  if (data.isLoading && !household) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (data.loadError || !household) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/households">
            <ArrowLeft size={14} />
            Vissza a listához
          </Link>
        </Button>
        <InsightBanner tone="danger" title="Nem található">
          A kért háztartás nem elérhető, vagy nincs jogosultságod megtekinteni.
        </InsightBanner>
      </div>
    );
  }

  const access = describeHouseholdAccess(household);
  const grantBlockedReason = householdGrantBlockedReason(household);
  const enabledModules = Object.entries(household.modules ?? {}).filter(([, enabled]) => enabled);
  const integrationRows = Object.entries(household.integrations ?? {});

  const usageMetrics = [
    { label: 'Tranzakciók', value: String(household.stats?.transactions ?? 0), tone: 'primary' as const },
    { label: 'Tartozások', value: String(household.stats?.debts ?? 0), tone: 'default' as const },
    { label: 'Megtakarítások', value: String(household.stats?.savings ?? 0), tone: 'default' as const },
    { label: 'Rezsi tételek', value: String(household.stats?.utilities ?? 0), tone: 'default' as const },
    { label: 'Mérőórák', value: String(household.stats?.meters ?? 0), tone: 'default' as const },
    { label: 'Rendelések', value: String(household.stats?.business_orders ?? 0), tone: 'default' as const },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/households' },
          { label: 'Háztartások', href: '/admin/households' },
          { label: household.name },
        ]}
        title={household.name}
        description={
          household.business_name?.trim()
            ? household.business_name.trim()
            : `Háztartás #${household.id}`
        }
        actions={
          <div className="flex flex-nowrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/households">
                <ArrowLeft size={14} />
                Vissza
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void data.refreshHousehold()} disabled={data.isLoading}>
              <RefreshCw size={14} className={data.isLoading ? 'animate-spin' : ''} />
              Frissítés
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={Boolean(grantBlockedReason)}
              title={grantBlockedReason ?? 'Háztartás végleges törlése'}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} />
              Törlés
            </Button>
          </div>
        }
        meta={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users size={12} />
            {household.active_members_count ?? household.members_count}/{household.members_count} aktív tag
            <span className="text-border">·</span>
            {formatTierLabel(access.effectiveTier)} hozzáférés
          </span>
        }
      />

      <AdminHouseholdAccessCard
        household={household}
        grantBlockedReason={grantBlockedReason}
        onEditGrant={() => setGrantOpen(true)}
      />

      <AdminHouseholdAiUsagePanel
        aiUsage={household.ai_usage}
        aiSettings={household.ai_settings}
        saving={data.savingAiSettings}
        onSave={data.updateAiSettings}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FactCard label="Háztartás ID" value={`#${household.id}`} />
        <FactCard
          label="Létrehozva"
          value={household.created_at ? formatDate(household.created_at) : '—'}
        />
        <FactCard
          label="Onboarding"
          value={household.onboarding_completed ? 'Kész' : 'Folyamatban'}
        />
        <FactCard
          label="Kategóriák"
          value={String(household.categories_count ?? household.categories?.length ?? 0)}
          hint="Költségvetés kategóriák száma"
        />
      </div>

      <MetricStrip
        items={[
          {
            label: 'Tagok',
            value: household.members_count,
            hint: `${household.active_members_count ?? household.members_count} aktív`,
            tone: 'primary',
          },
          {
            label: 'Pénztárcák',
            value: household.stats?.wallets ?? 0,
          },
          ...usageMetrics.slice(0, 2),
        ]}
        columns={4}
        variant="separated"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionPanel
          title="Modulok"
          description={`${enabledModules.length} bekapcsolt modul`}
          icon={Layers}
          tone="primary"
        >
          {enabledModules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Egy modul sincs bekapcsolva.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {enabledModules.map(([key]) => (
                <StatusPill key={key} status="info" size="xs">
                  {ADMIN_MODULE_LABELS[key] ?? key}
                </StatusPill>
              ))}
            </div>
          )}
        </SectionPanel>

        <SectionPanel
          title="Integrációk"
          description="Webshop és SumUp kapcsolatok"
          icon={Plug}
          tone="info"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {integrationRows.map(([key, integration]) => (
              <div
                key={key}
                className={classNames(
                  'rounded-lg border px-3 py-3',
                  integration.enabled
                    ? integration.configured
                      ? 'border-emerald-500/25 bg-emerald-500/5'
                      : 'border-amber-500/25 bg-amber-500/5'
                    : 'border-border bg-muted/20',
                )}
              >
                <p className="text-sm font-medium text-foreground">
                  {ADMIN_INTEGRATION_LABELS[key] ?? key}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {integration.enabled
                    ? integration.configured
                      ? 'Bekapcsolva és konfigurálva'
                      : 'Bekapcsolva, de hiányos beállítás'
                    : 'Kikapcsolva'}
                </p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel
        title="Adatmennyiség"
        description="Rögzített tételek száma a háztartásban"
        icon={BarChart3}
        tone="slate"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {usageMetrics.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/15 px-3 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums text-foreground">{item.value}</p>
              <p className="text-[0.72rem] text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-muted/15 px-3 py-3 text-center">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{household.stats?.wallets ?? 0}</p>
            <p className="text-[0.72rem] text-muted-foreground mt-1">Pénztárcák</p>
          </div>
        </div>
      </SectionPanel>

      {household.business_name?.trim() ? (
        <SectionPanel title="Vállalkozás" icon={Building2} tone="success">
          <p className="text-sm text-foreground font-medium">{household.business_name.trim()}</p>
        </SectionPanel>
      ) : null}

      <SectionPanel
        title="Tagok"
        description="Felhasználók ebben a háztartásban — inaktiválás = belépés tiltása, adatok megmaradnak"
        icon={Users}
        tone="primary"
        badge={
          <StatusPill status="neutral" size="xs">
            {household.members?.length ?? 0}
          </StatusPill>
        }
      >
        <AdminHouseholdMembersTable
            members={household.members ?? []}
            canManageMember={data.canManageMember}
            onActivate={setActivateTarget}
            onDeactivate={setDeactivateTarget}
            onImpersonate={setImpersonateTarget}
            onResetPassword={setResetPasswordTarget}
          />
      </SectionPanel>

      <AdminTierGrantModal
        target={grantOpen ? household : null}
        onClose={() => setGrantOpen(false)}
        onSubmit={handleGrant}
        loading={data.savingTierGrant}
      />
      <AdminActivateModal
        target={activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={() => {
          if (!activateTarget) return;
          void data.activateMember(activateTarget).then((ok) => ok && setActivateTarget(null));
        }}
        loading={data.activating}
      />
      <AdminDeactivateModal
        target={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (!deactivateTarget) return;
          void data.deactivateMember(deactivateTarget).then((ok) => ok && setDeactivateTarget(null));
        }}
        loading={data.deactivating}
      />
      <AdminImpersonateModal
        target={impersonateTarget}
        onClose={() => setImpersonateTarget(null)}
        onConfirm={() => {
          if (!impersonateTarget) return;
          void data.impersonateMember(impersonateTarget).then((ok) => ok && setImpersonateTarget(null));
        }}
        loading={data.impersonating}
      />
      <AdminDeleteHouseholdModal
        household={deleteOpen ? household : null}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(confirmName) => data.deleteHousehold(confirmName)}
        loading={data.deletingHousehold}
      />
      <AdminResetPasswordModal
        target={resetPasswordTarget}
        onClose={() => setResetPasswordTarget(null)}
        onConfirm={(password, passwordConfirmation) => {
          if (!resetPasswordTarget) return Promise.resolve(false);
          return data.resetMemberPassword(resetPasswordTarget, password, passwordConfirmation).then(
            (ok) => {
              if (ok) setResetPasswordTarget(null);
              return ok;
            },
          );
        }}
        loading={data.resettingPassword}
      />
    </div>
  );
}
