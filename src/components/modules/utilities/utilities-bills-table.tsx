'use client';

import { formatHUF, today, compareDates, hasSettlementDate } from '@/utils';
import { UtilitySplitRule, UtilityBill } from '@/types';
import { isUtilityBillOverdue } from '@/lib/utilityBills';
import { Button } from '@/components/ui/button';
import { ClickableSelect } from '@/components/ui/clickable-select';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
import { payerSideLabel, privateRuleOwnerLabel } from '@/lib/utilityViewer';
import {
  DataTable,
  Section,
  StatusPill,
  StatusToggleButton,
  EmptyState,
  EntityCell,
  DueDateCell,
  RowActions,
  type DataTableColumn,
} from '@/components/design';
import {
  CheckCircle,
  Clock,
  Copy,
  LayoutTemplate,
  Receipt,
  Users,
  User,
  XCircle,
} from 'lucide-react';
import type { UtilitiesPageState } from '@/components/modules/utilities/hooks/use-utilities-page-state';

type UtilitiesBillsTableProps = Pick<
  UtilitiesPageState,
  | 'sortedBills'
  | 'filteredBills'
  | 'selectedMonth'
  | 'selectedYear'
  | 'utilitySplitEnabled'
  | 'utilityLabels'
  | 'isReader'
  | 'todayStr'
  | 'handleEdit'
  | 'deleteBill'
  | 'updateBill'
  | 'requestDelete'
  | 'wrapBillPending'
  | 'isBillPending'
  | 'cloning'
  | 'runClone'
  | 'clonePreviousMonth'
  | 'templating'
  | 'handleGenerateFromTemplates'
  | 'utilityTemplates'
>;

function getRuleBadge(rule: UtilitySplitRule, utilityLabels: UtilitiesPageState['utilityLabels']) {
  if (rule === 'shared') {
    return (
      <StatusPill status="info" size="xs">
        <Users size={9} strokeWidth={2.4} /> Közös 50/50
      </StatusPill>
    );
  }
  return (
    <StatusPill status="neutral" size="xs">
      <User size={9} strokeWidth={2.4} /> {privateRuleOwnerLabel(rule, utilityLabels)}
    </StatusPill>
  );
}

export function UtilitiesBillsTable({
  sortedBills,
  filteredBills,
  selectedMonth,
  selectedYear,
  utilitySplitEnabled,
  utilityLabels,
  isReader,
  todayStr,
  handleEdit,
  deleteBill,
  updateBill,
  requestDelete,
  wrapBillPending,
  isBillPending,
  cloning,
  runClone,
  clonePreviousMonth,
  templating,
  handleGenerateFromTemplates,
  utilityTemplates,
}: UtilitiesBillsTableProps) {
  const { householdPayerLabel, partnerPayerLabel } = utilityLabels;

  const billOverdue = (row: UtilityBill) =>
    isUtilityBillOverdue(row, { splitEnabled: utilitySplitEnabled, today: todayStr });

  const columns: DataTableColumn<UtilityBill>[] = [
    {
      key: 'type',
      header: 'Tétel',
      width: '40%',
      cell: (row) => {
        const isOverdue = billOverdue(row);
        const tone = hasSettlementDate(row.paidDate) || (utilitySplitEnabled && row.paidBy) ? 'success' : isOverdue ? 'danger' : 'warning';
        return (
          <EntityCell
            icon={Receipt}
            tone={tone}
            title={row.type}
            subtitle={utilitySplitEnabled ? getRuleBadge(row.splitRule, utilityLabels) : undefined}
          />
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Határidő',
      width: '14%',
      cell: (row) => <DueDateCell date={row.dueDate} today={todayStr} overdue={billOverdue(row)} />,
    },
    {
      key: 'amount',
      header: 'Összeg',
      align: 'right',
      width: '14%',
      cell: (row) => (
        <span className="font-semibold tabular-nums text-foreground text-[0.95rem]">{formatHUF(row.total)}</span>
      ),
    },
    {
      key: 'status',
      header: (
        <span className="inline-flex items-center justify-center gap-1 w-full">
          <span>{utilitySplitEnabled ? 'Fizette' : 'Státusz'}</span>
          <InfoTooltip
            content={utilitySplitEnabled ? HELP.utilities.payerSelect : HELP.utilities.statusToggle}
            side="top"
            label={utilitySplitEnabled ? 'Fizette – kattintható' : 'Státusz – kattintható'}
          />
        </span>
      ),
      align: 'center',
      width: '18%',
      cell: (row) => {
        const isOverdue = billOverdue(row);
        if (utilitySplitEnabled) {
          return (
            <ClickableSelect
              value={row.paidBy || 'Fizetendő'}
              tone={row.paidBy ? 'success' : 'warning'}
              title={
                row.paidBy
                  ? `${payerSideLabel(row.paidBy, utilityLabels)} fizette — kattints a módosításhoz`
                  : 'Ki fizette? Válassz a legördülőből'
              }
              disabled={isReader || isBillPending(row.id)}
              onChange={(val) => {
                void wrapBillPending(row.id, async () => {
                  if (val === 'Fizetendő') await updateBill(row.id, { paidBy: null, paidDate: null });
                  else
                    await updateBill(row.id, {
                      paidBy: val as 'Mi' | 'Ildi',
                      paidDate: today(),
                    });
                });
              }}
              options={[
                { value: 'Fizetendő', label: 'Függőben' },
                { value: 'Mi', label: householdPayerLabel },
                { value: 'Ildi', label: partnerPayerLabel },
              ]}
            />
          );
        }
        const statusTitle = hasSettlementDate(row.paidDate)
          ? 'Kifizetve — kattints visszaállításhoz'
          : isOverdue
            ? 'Lejárt — kattints kifizetettként jelöléshez'
            : 'Várakozik — kattints kifizetettként jelöléshez';
        return (
          <StatusToggleButton
            status={hasSettlementDate(row.paidDate) ? 'success' : isOverdue ? 'danger' : 'warning'}
            title={statusTitle}
            pending={isBillPending(row.id)}
            onClick={() =>
              void wrapBillPending(row.id, () =>
                updateBill(row.id, {
                  paidDate: hasSettlementDate(row.paidDate) ? null : today(),
                }),
              )
            }
          >
            {hasSettlementDate(row.paidDate) ? (
              <>
                <CheckCircle size={9} /> Kész
              </>
            ) : isOverdue ? (
              <>
                <XCircle size={9} /> Lejárt
              </>
            ) : (
              <>
                <Clock size={9} /> Várakozik
              </>
            )}
          </StatusToggleButton>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '14%',
      cell: (row) =>
        !isReader ? (
          <RowActions
            onEdit={() => handleEdit(row)}
            onDelete={() =>
              requestDelete({
                title: 'Rezsi tétel törlése',
                message: `Biztosan törlöd a „${row.type}" számlát? Ez a művelet nem vonható vissza.`,
                onConfirm: () => deleteBill(row.id),
              })
            }
          />
        ) : null,
    },
  ];

  return (
    <Section
      title={`Számlák · ${selectedYear}. ${String(selectedMonth).padStart(2, '0')}.`}
      description={`${filteredBills.length} rögzített tétel`}
    >
      {sortedBills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nincsenek rögzített tételek"
          description="Másold az előző hónapot, töltsd ki sablonból (Beállítások), vagy rögzíts kézzel."
          action={
            !isReader ? (
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  loading={cloning}
                  onClick={() => void runClone(() => clonePreviousMonth(selectedMonth, selectedYear))}
                >
                  {!cloning && <Copy size={13} />} {cloning ? 'Másolás…' : 'Múlt havi másolás'}
                </Button>
                {utilityTemplates.length > 0 && (
                  <Button size="sm" loading={templating} onClick={handleGenerateFromTemplates}>
                    {!templating && <LayoutTemplate size={13} />} {templating ? 'Generálás…' : 'Sablonból'}
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={sortedBills} rowKey={(row) => row.id} />
      )}
    </Section>
  );
}
