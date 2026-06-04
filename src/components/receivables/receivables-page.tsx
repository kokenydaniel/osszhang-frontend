'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HandCoins, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip, ModulePageSkeleton, InsightBanner, EmptyState } from '@/components/design';
import { useReceivablesStore } from '@/stores/receivablesStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { receivablesClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { receivablesCalculations } from '@/calculations/receivables';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadableStatus } from '@/utils/loadable-status';
import type { ReceivableContact, ReceivableEntry } from '@/types/receivables';
import type { ReceivableEntryType } from '@/config/receivables';
import { ReceivableContactModal } from './receivable-contact-modal';
import { ReceivableEntryModal } from './receivable-entry-modal';
import { ReceivableContactPanel } from './receivable-contact-panel';

export function ReceivablesPage() {
  const user = useAuthStore((s) => s.user);
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const contacts = useReceivablesStore((s) => s.contacts);
  const summary = useReceivablesStore((s) => s.summary);
  const status = useReceivablesStore((s) => s.status);

  const [contactModal, setContactModal] = useState<ReceivableContact | 'create' | null>(null);
  const [entryModal, setEntryModal] = useState<{
    contact: ReceivableContact;
    entry: ReceivableEntry | null;
    defaultType: ReceivableEntryType;
  } | null>(null);

  const isReader = isHouseholdReader(user);
  const canEdit = canEditHousehold(user);

  useEffect(() => {
    void useReceivablesStore.getState().fetch(true);
  }, []);

  const sortedContacts = useMemo(() => receivablesCalculations.sortContacts(contacts), [contacts]);
  const metrics = useMemo(() => receivablesCalculations.buildMetricStrip(summary), [summary]);

  const refresh = useCallback(async () => {
    await useReceivablesStore.getState().fetch(true);
  }, []);

  const handleContactSaved = useCallback(
    async (contact: ReceivableContact, mode: 'create' | 'update') => {
      useReceivablesStore.getState().upsertContact(contact);
      addNotification(mode === 'create' ? 'Személy hozzáadva.' : 'Személy frissítve.', 'success');
      await refresh();
    },
    [addNotification, refresh],
  );

  const handleEntrySaved = useCallback(
    async (contact: ReceivableContact) => {
      useReceivablesStore.getState().upsertContact(contact);
      addNotification('Tétel mentve.', 'success');
      await refresh();
    },
    [addNotification, refresh],
  );

  const handleDeleteContact = useCallback(
    (contact: ReceivableContact) => {
      requestDelete({
        title: 'Személy törlése',
        message: `Biztosan törlöd „${contact.name}” összes tételével együtt?`,
        onConfirm: async () => {
          const res = await receivablesClient.deleteContact(contact.id);
          if (!res || res[0] !== StatusCodes.Http200) {
            addNotification('A törlés nem sikerült.', 'error');
            return;
          }
          useReceivablesStore.getState().removeContact(contact.id);
          addNotification('Személy törölve.', 'success');
          await refresh();
        },
      });
    },
    [requestDelete, addNotification, refresh],
  );

  const handleDeleteEntry = useCallback(
    (contact: ReceivableContact, entry: ReceivableEntry) => {
      requestDelete({
        title: 'Tétel törlése',
        message: 'Biztosan törlöd ezt a mozgást?',
        onConfirm: async () => {
          const res = await receivablesClient.deleteEntry(entry.id);
          if (!res || res[0] !== StatusCodes.Http200) {
            addNotification('A törlés nem sikerült.', 'error');
            return;
          }
          if (res[1]) useReceivablesStore.getState().upsertContact(res[1]);
          addNotification('Tétel törölve.', 'success');
          await refresh();
        },
      });
    },
    [requestDelete, addNotification, refresh],
  );

  if (status === LoadableStatus.Loading && contacts.length === 0) {
    return <ModulePageSkeleton />;
  }

  const contactModalEntity = contactModal && contactModal !== 'create' ? contactModal : null;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Kintlévőség' }]}
        title="Kintlévőség"
        description="Kinek adtál pénzt, mennyi van még nála, és miből adtad — kölcsön, közös vásárlás, előleg."
        actions={
          canEdit ? (
            <Button type="button" onClick={() => setContactModal('create')}>
              <Plus size={14} />
              Új személy
            </Button>
          ) : null
        }
      />

      <InsightBanner tone="info" icon={HandCoins} title="Magán kintlévőség">
        Ez nem hitel, amit te tartozol, hanem amit másoknak adtál át (megtakarításból, utalással vagy készpénzben), és
        még vissza kellene kapnod.
      </InsightBanner>

      <MetricStrip items={metrics} columns={4} variant="separated" />

      {sortedContacts.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="Még nincs kintlévőség"
          description={
            isReader
              ? 'Az adminisztrátor még nem vett fel senkit.'
              : 'Add hozzá azt, akinek adtál pénzt, kölcsönt vagy közös vásárlás miatt előleget.'
          }
          action={
            canEdit ? (
              <Button type="button" onClick={() => setContactModal('create')}>
                <Plus size={14} />
                Első személy
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sortedContacts.map((contact) => (
            <ReceivableContactPanel
              key={contact.id}
              contact={contact}
              canEdit={canEdit}
              onEditContact={() => setContactModal(contact)}
              onDeleteContact={() => handleDeleteContact(contact)}
              onAddEntry={(type) => setEntryModal({ contact, entry: null, defaultType: type })}
              onEditEntry={(entry) => setEntryModal({ contact, entry, defaultType: entry.entryType })}
              onDeleteEntry={(entry) => handleDeleteEntry(contact, entry)}
            />
          ))}
        </div>
      )}

      <ReceivableContactModal
        open={contactModal !== null}
        contact={contactModalEntity}
        onClose={() => setContactModal(null)}
        onSaved={(c, mode) => void handleContactSaved(c, mode)}
      />

      <ReceivableEntryModal
        open={entryModal !== null}
        contact={entryModal?.contact ?? null}
        entry={entryModal?.entry ?? null}
        defaultEntryType={entryModal?.defaultType ?? 'lent'}
        onClose={() => setEntryModal(null)}
        onSaved={(c) => void handleEntrySaved(c)}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
