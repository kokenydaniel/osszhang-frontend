'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip, ModulePageSkeleton, SectionPanel } from '@/components/design';
import { useInsuranceStore } from '@/stores/insuranceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { insuranceClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { insuranceCalculations, isPolicyEffectivelyActive } from '@/calculations/insurance';
import { resolveInsuranceSettings } from '@/settings/insurance';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { LoadableStatus } from '@/utils/loadable-status';
import type { InsurancePolicy } from '@/types/insurance';
import { InsuranceReminderBanner } from './insurance-reminder-banner';
import { InsurancePolicyCard } from './insurance-policy-card';
import { InsurancePoliciesTable } from './insurance-policies-table';
import { InsurancePolicyModal } from './insurance-policy-modal';

type StatusFilter = 'all' | 'active' | 'inactive';

export function InsurancePage() {
  const user = useAuthStore((s) => s.user);
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const policies = useInsuranceStore((s) => s.policies);
  const upcoming = useInsuranceStore((s) => s.upcoming);
  const status = useInsuranceStore((s) => s.status);

  const [modalPolicy, setModalPolicy] = useState<InsurancePolicy | 'create' | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const settings = useMemo(() => resolveInsuranceSettings(user?.household), [user?.household]);
  const isReader = isHouseholdReader(user);
  const canEdit = canEditHousehold(user);

  useEffect(() => {
    void useInsuranceStore.getState().fetch();
  }, []);

  const filteredPolicies = useMemo(() => {
    if (statusFilter === 'active') return policies.filter((p) => isPolicyEffectivelyActive(p));
    if (statusFilter === 'inactive') return policies.filter((p) => !isPolicyEffectivelyActive(p));
    return policies;
  }, [policies, statusFilter]);

  const summary = useMemo(
    () => insuranceCalculations.buildSummary(policies, upcoming),
    [policies, upcoming],
  );

  const metrics = useMemo(
    () => insuranceCalculations.buildMetricStrip(summary, settings.default_currency),
    [summary, settings.default_currency],
  );

  const handleSaved = useCallback(
    (_saved: InsurancePolicy, mode: 'create' | 'update') => {
      addNotification(mode === 'create' ? 'Szerződés létrehozva.' : 'Szerződés frissítve.', 'success');
    },
    [addNotification],
  );

  const handleDelete = useCallback(
    async (policy: InsurancePolicy) => {
      const res = await insuranceClient.delete(policy.id);
      if (!res || res[0] !== StatusCodes.Http200) {
        addNotification('A törlés nem sikerült.', 'error');
        return;
      }
      const deleted = res[1];
      useInsuranceStore.getState().markPolicyDeleted(deleted);
      addNotification(
        'Szerződés törölve. A múltbeli költségvetési díjak megmaradnak; a jövőbeli tételek eltűnnek.',
        'success',
      );
    },
    [addNotification],
  );

  const isInitialLoad = status === LoadableStatus.Loading && policies.length === 0;
  if (isInitialLoad) {
    return <ModulePageSkeleton />;
  }

  const modalPolicyEntity = modalPolicy && modalPolicy !== 'create' ? modalPolicy : null;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Család' }, { label: 'Biztosítások' }]}
        title="Biztosítások"
        description="Lakás, autó, élet és egyéb szerződések — díjak, megújítások és kötvények egy helyen."
        actions={
          canEdit ? (
            <Button type="button" onClick={() => setModalPolicy('create')}>
              <Plus size={14} />
              Új szerződés
            </Button>
          ) : undefined
        }
      />

      <InsuranceReminderBanner upcoming={upcoming} reminderDays={settings.reminder_days_before} />

      <MetricStrip
        items={metrics}
        columns={Math.min(5, Math.max(2, metrics.length)) as 2 | 3 | 4 | 5}
      />

      <SectionPanel title="Szerződések" className="shadow-soft">
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            Mind ({policies.length})
          </FilterChip>
          <FilterChip active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>
            Aktív ({summary.activeCount})
          </FilterChip>
          <FilterChip active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')}>
            Megszűnt ({summary.inactiveCount})
          </FilterChip>
        </div>

        {filteredPolicies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Még nincs szerződés. Add hozzá az elsőt a fenti gombbal.
          </p>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {filteredPolicies.map((p) => (
                <InsurancePolicyCard
                  key={p.id}
                  policy={p}
                  canEdit={canEdit}
                  onEdit={canEdit ? () => setModalPolicy(p) : undefined}
                />
              ))}
            </div>
            <div className="md:hidden">
              <InsurancePoliciesTable
                policies={filteredPolicies}
                isReader={isReader}
                onEdit={(p) => setModalPolicy(p)}
                onDelete={(p) =>
                  requestDelete({
                    title: 'Szerződés törlése',
                    message: `Biztosan törlöd: „${p.name}"?`,
                    onConfirm: () => handleDelete(p),
                  })
                }
              />
            </div>
            <details className="hidden md:block mt-2">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                Lista nézet
              </summary>
              <div className="mt-3">
                <InsurancePoliciesTable
                  policies={filteredPolicies}
                  isReader={isReader}
                  onEdit={(p) => setModalPolicy(p)}
                  onDelete={(p) =>
                    requestDelete({
                      title: 'Szerződés törlése',
                      message: `Biztosan törlöd: „${p.name}"?`,
                      onConfirm: () => handleDelete(p),
                    })
                  }
                />
              </div>
            </details>
          </>
        )}
      </SectionPanel>

      <InsurancePolicyModal
        open={modalPolicy !== null}
        policy={modalPolicyEntity}
        onClose={() => setModalPolicy(null)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {children}
    </button>
  );
}
