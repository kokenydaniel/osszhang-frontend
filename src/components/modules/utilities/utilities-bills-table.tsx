'use client';

import { formatHUF, today, hasSettlementDate } from '@/utils';
import { UtilitySplitRule, UtilityBill } from '@/types';
import { UtilitiesService } from '@/services/UtilitiesService';
import { Button } from '@/components/ui/button';
import { ClickableSelect } from '@/components/ui/clickable-select';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
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
import type { UtilitySplitLabels } from '@/services/UtilitiesService';
import type { UtilityTemplate } from '@/lib/utilityTemplates';
import type { UpdateUtilityBillPayload } from '@/mappers/utilities.mapper';

interface UtilitiesBillsTableProps {
  sortedBills: UtilityBill[];
  filteredBills: UtilityBill[];
  selectedMonth: number;
  selectedYear: number;
  utilitySplitEnabled: boolean;
  utilityLabels: UtilitySplitLabels;
  isReader: boolean;
  todayStr: string;
  onEditBill: (bill: UtilityBill) => void;
  onDeleteBill: (id: number) => void | Promise<void>;
  onUpdateBill: (id: number, payload: UpdateUtilityBillPayload) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void | Promise<void> }) => void;
  wrapBillPending: (id: number, fn: () => Promise<void>) => Promise<void>;
  isBillPending: (id: number) => boolean;
  cloning: boolean;
  runClone: (fn: () => Promise<void>) => Promise<void>;
  onClonePreviousMonth: (month: number, year: number) => Promise<void>;
  templating: boolean;
  onGenerateFromTemplates: () => void;
  utilityTemplates: UtilityTemplate[];
}

function getRuleBadge(rule: UtilitySplitRule, utilityLabels: UtilitySplitLabels) {
  if (rule === 'shared') {
    return (
      <StatusPill status="info" size="xs">
        <Users size={9} strokeWidth={2.4} /> Közös 50/50
      </StatusPill>
    );
  }
  return (
    <StatusPill status="neutral" size="xs">
      <User size={9} strokeWidth={2.4} /> {UtilitiesService.privateRuleOwnerLabel(rule, utilityLabels)}
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
  onEditBill,
  onDeleteBill,
  onUpdateBill,
  requestDelete,
  wrapBillPending,
  isBillPending,
  cloning,
  runClone,
  onClonePreviousMonth,
  templating,
  onGenerateFromTemplates,
  utilityTemplates,
}: UtilitiesBillsTableProps) {
  const { householdPayerLabel, partnerPayerLabel } = utilityLabels;

  const billOverdue = (row: UtilityBill) =>
    UtilitiesService.isBillOverdue(row, { splitEnabled: utilitySplitEnabled, today: todayStr });

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
                  ? `${UtilitiesService.payerSideLabel(row.paidBy, utilityLabels)} fizette — kattints a módosításhoz`
                  : 'Ki fizette? Válassz a legördülőből'
              }
              disabled={isReader || isBillPending(row.id)}
              onChange={(val) => {
                void wrapBillPending(row.id, async () => {
                  if (val === 'Fizetendő') await onUpdateBill(row.id, { paidBy: null, paidDate: null });
                  else
                    await onUpdateBill(row.id, {
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
                onUpdateBill(row.id, {
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
            onEdit={() => onEditBill(row)}
            onDelete={() =>
              requestDelete({
                title: 'Rezsi tétel törlése',
                message: `Biztosan törlöd a „${row.type}" számlát? Ez a művelet nem vonható vissza.`,
                onConfirm: () => void onDeleteBill(row.id),
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
                  onClick={() => void runClone(() => onClonePreviousMonth(selectedMonth, selectedYear))}
                >
                  {!cloning && <Copy size={13} />} {cloning ? 'Másolás…' : 'Múlt havi másolás'}
                </Button>
                {utilityTemplates.length > 0 && (
                  <Button size="sm" loading={templating} onClick={onGenerateFromTemplates}>
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
