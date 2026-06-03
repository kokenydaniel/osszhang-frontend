'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip, ModulePageSkeleton, SectionPanel, InsightBanner } from '@/components/design';
import { usePocketMoneyStore } from '@/stores/pocketMoneyStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useEnsureExchangeRates } from '@/hooks/useEnsureExchangeRates';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { pocketMoneyClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import {
  pocketMoneyCalculations,
  pocketMoneyMemberKey,
  POCKET_MONEY_ENTRY_HINTS,
} from '@/calculations/pocket-money';
import { mergeRosterWithEntryMembers, resolvePocketMoneySettings } from '@/settings/pocket-money';
import { persistPocketMoneyRoster, upsertRosterMember } from '@/lib/pocket-money-roster';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { LoadableStatus } from '@/utils/loadable-status';
import { formatMonthYear } from '@/utils';
import type { PocketMoneyDisplayMember, PocketMoneyEntry, PocketMoneyRosterMember } from '@/types/pocket-money';
import { PocketMoneyMembersPanel } from './pocket-money-members-panel';
import { PocketMoneyInterestPanel } from './pocket-money-interest-panel';
import { PocketMoneyTable } from './pocket-money-table';
import { PocketMoneyEntryModal } from './pocket-money-entry-modal';
import {
  PocketMoneyMemberModal,
  type PocketMoneyMemberModalMode,
} from './pocket-money-member-modal';

function defaultEntryDate(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  const today = new Date();
  if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) {
    return today.toISOString().slice(0, 10);
  }
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function PocketMoneyPage() {
  const user = useAuthStore((s) => s.user);
  const { selectedYear, selectedMonth } = usePeriodStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  useEnsureExchangeRates();
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  const entries = usePocketMoneyStore((s) => s.entries);
  const members = usePocketMoneyStore((s) => s.members);
  const status = usePocketMoneyStore((s) => s.status);
  const loadedPeriod = usePocketMoneyStore((s) => s.loadedPeriod);

  const [entryModal, setEntryModal] = useState<PocketMoneyEntry | 'create' | null>(null);
  const [applyingInterest, setApplyingInterest] = useState(false);
  const [memberModal, setMemberModal] = useState<PocketMoneyMemberModalMode | null>(null);
  const [selectedMemberKey, setSelectedMemberKey] = useState<string | null>(null);

  const settings = useMemo(() => resolvePocketMoneySettings(user?.household), [user?.household]);
  const roster = useMemo(
    () => mergeRosterWithEntryMembers(settings.members, entries),
    [settings.members, entries],
  );
  const isReader = isHouseholdReader(user);
  const canEdit = canEditHousehold(user);
  const periodLabel = formatMonthYear(selectedMonth, selectedYear);
  const householdUsers = user?.household?.users ?? [];

  useEffect(() => {
    void usePocketMoneyStore.getState().fetch(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const displayMembers = useMemo(
    () => pocketMoneyCalculations.mergeDisplayMembers(roster, members, settings.default_currency),
    [roster, members, settings.default_currency],
  );

  const filteredEntries = useMemo(() => {
    if (!selectedMemberKey) return entries;
    return entries.filter(
      (e) => pocketMoneyMemberKey(e.memberUserId, e.memberLabel) === selectedMemberKey,
    );
  }, [entries, selectedMemberKey]);

  const selectedRosterId = useMemo(() => {
    if (!selectedMemberKey) return null;
    const row = roster.find(
      (m) => pocketMoneyMemberKey(m.memberUserId, m.label) === selectedMemberKey,
    );
    return row?.id ?? null;
  }, [roster, selectedMemberKey]);

  const summary = useMemo(
    () =>
      pocketMoneyCalculations.buildSummaryMetrics(
        entries,
        members,
        settings.default_currency,
        exchangeRates,
      ),
    [entries, members, settings.default_currency, exchangeRates],
  );

  const metrics = useMemo(
    () => pocketMoneyCalculations.buildMetricStrip(summary, settings.default_currency),
    [summary, settings.default_currency],
  );

  const handleSaveMember = useCallback(
    async (member: PocketMoneyRosterMember, mode: 'create' | 'update') => {
      const saveMode = member.id.startsWith('legacy-') ? 'create' : mode;
      const next = upsertRosterMember(settings.members, member, saveMode);
      const ok = await persistPocketMoneyRoster(next);
      if (!ok) throw new Error('save failed');
      addNotification(saveMode === 'create' ? 'Gyerek hozzáadva.' : 'Gyerek frissítve.', 'success');
    },
    [addNotification, settings.members],
  );

  const openEditMember = useCallback(
    (display: PocketMoneyDisplayMember) => {
      const member = roster.find(
        (m) => pocketMoneyMemberKey(m.memberUserId, m.label) === display.memberKey,
      );
      if (member) setMemberModal({ mode: 'edit', member });
    },
    [roster],
  );

  const handleSaved = useCallback(
    (saved: PocketMoneyEntry, mode: 'create' | 'update') => {
      usePocketMoneyStore.getState().upsertEntry(saved);
      addNotification(mode === 'create' ? 'Tétel hozzáadva.' : 'Tétel frissítve.', 'success');
      void usePocketMoneyStore.getState().refreshSilent(selectedYear, selectedMonth);
    },
    [addNotification, selectedMonth, selectedYear],
  );

  const handleApplyInterest = useCallback(async () => {
    setApplyingInterest(true);
    try {
      const res = await pocketMoneyClient.applyInterest(selectedYear, selectedMonth);
      if (!res || res[0] !== StatusCodes.Http200) {
        addNotification('A kamat rögzítése nem sikerült.', 'error');
        return;
      }
      const data = res[1] as { applied?: number };
      addNotification(
        data.applied ? `Kamat rögzítve (${data.applied} gyerek).` : 'Nincs rögzíthető kamat ebben a hónapban.',
        data.applied ? 'success' : 'info',
      );
      void usePocketMoneyStore.getState().refreshSilent(selectedYear, selectedMonth);
    } finally {
      setApplyingInterest(false);
    }
  }, [addNotification, selectedMonth, selectedYear]);

  const handleDelete = useCallback(
    async (id: number) => {
      const res = await pocketMoneyClient.delete(id);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) {
        addNotification('A törlés nem sikerült.', 'error');
        return;
      }
      usePocketMoneyStore.getState().removeEntry(id);
      addNotification('Tétel törölve.', 'success');
      void usePocketMoneyStore.getState().refreshSilent(selectedYear, selectedMonth);
    },
    [addNotification, selectedMonth, selectedYear],
  );

  const isInitialLoad = status === LoadableStatus.Loading && loadedPeriod === null;
  const modalEntry = entryModal && entryModal !== 'create' ? entryModal : null;
  if (isInitialLoad) {
    return <ModulePageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Család' }, { label: 'Zsebpénz' }]}
        title="Zsebpénz"
        description={`${periodLabel} — az egyenleg hónapról hónapra halmozódik; a mozgások listája csak erre a hónapra szól.`}
        actions={
          canEdit ? (
            <Button
              type="button"
              onClick={() => {
                if (roster.length === 0) {
                  setMemberModal({ mode: 'create' });
                  addNotification('Először add hozzá a gyereket.', 'info');
                  return;
                }
                setEntryModal('create');
              }}
            >
              <Plus size={14} />
              Új tétel
            </Button>
          ) : undefined
        }
      />

      <InsightBanner tone="info" icon={Info} title="Típusok és összegek">
        <p className="text-sm text-muted-foreground mb-2">
          Különböző pénznemű tételek (pl. HUF + EUR) együttes egyenlege forintra váltva jelenik meg, a költségvetéshez
          hasonló élő árfolyamon.
        </p>
        <ul className="list-disc pl-4 space-y-1 text-sm">
          <li>
            <strong>Kiosztás</strong> — {POCKET_MONEY_ENTRY_HINTS.allowance}
          </li>
          <li>
            <strong>Költés</strong> — {POCKET_MONEY_ENTRY_HINTS.expense}
          </li>
          <li>
            <strong>Korrekció</strong> — {POCKET_MONEY_ENTRY_HINTS.adjustment}
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3">
          Az egyenleg hónapról hónapra gyűlik; a kamat (ha be van kapcsolva) a modul beállításokban állítható, majd hónap végén
          rögzíthető.
        </p>
      </InsightBanner>

      <MetricStrip items={metrics} />

      <PocketMoneyMembersPanel
        members={displayMembers}
        selectedMemberKey={selectedMemberKey}
        onSelectMember={setSelectedMemberKey}
        canEdit={canEdit}
        onAddMember={canEdit ? () => setMemberModal({ mode: 'create' }) : undefined}
        onEditMember={canEdit ? openEditMember : undefined}
      />

      <PocketMoneyInterestPanel
        periodLabel={periodLabel}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        settings={settings}
        members={displayMembers}
        canEdit={canEdit}
        applying={applyingInterest}
        onApply={() => void handleApplyInterest()}
      />

      <SectionPanel
        title="Mozgások"
        description={`${periodLabel} · ${filteredEntries.length} tétel${selectedMemberKey ? ' (szűrve)' : ''}`}
        className="shadow-soft"
      >
        <PocketMoneyTable
          entries={filteredEntries}
          roster={roster}
          exchangeRates={exchangeRates}
          isReader={isReader}
          onEdit={(e) => setEntryModal(e)}
          onDelete={handleDelete}
          requestDelete={requestDelete}
        />
      </SectionPanel>

      <PocketMoneyEntryModal
        open={entryModal !== null}
        entry={modalEntry}
        defaultDate={defaultEntryDate(selectedYear, selectedMonth)}
        preselectedRosterMemberId={entryModal === 'create' ? selectedRosterId : null}
        onClose={() => setEntryModal(null)}
        onSaved={handleSaved}
        onAddMember={canEdit ? () => setMemberModal({ mode: 'create' }) : undefined}
      />

      <PocketMoneyMemberModal
        open={memberModal !== null}
        state={memberModal}
        householdUsers={householdUsers}
        onClose={() => setMemberModal(null)}
        onSave={handleSaveMember}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
