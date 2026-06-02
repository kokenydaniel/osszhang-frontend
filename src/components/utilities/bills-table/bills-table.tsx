'use client';

import React from 'react';

import { formatHUF, today, hasSettlementDate } from '@/utils';
import { HELP } from '@/config/help';
import { utilitiesCalculations } from '@/calculations/utilities';
import { utilitiesClient } from '@/lib/api-client';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { StatusCodes } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ClickableSelect } from '@/components/ui/clickable-select';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { BillRowActions } from './bill-row-actions';
import {
  DataTable,
  Section,
  StatusPill,
  StatusToggleButton,
  EmptyState,
  EntityCell,
  DueDateCell,
  type DataTableColumn,
} from '@/components/design';
import {
  CheckCircle,
  Clock,
  Receipt,
  Users,
  User,
  XCircle,
} from 'lucide-react';
import type { UtilityBill, UtilitySplitRule } from '@/types';
import type { UtilitySplitLabels } from '@/calculations/utilities';

interface BillsTableProps {
  sortedBills: UtilityBill[];
  filteredBills: UtilityBill[];
  selectedMonth: number;
  selectedYear: number;
  utilitySplitEnabled: boolean;
  utilityLabels: UtilitySplitLabels;
  isReader: boolean;
  onEditBill: (bill: UtilityBill) => void;
  onRefresh: () => void;
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
      <User size={9} strokeWidth={2.4} /> {utilitiesCalculations.privateRuleOwnerLabel(rule, utilityLabels)}
    </StatusPill>
  );
}

/**
 * Presentation-only table: data via props, columns defined here,
 * row actions delegated to BillRowActions.
 */
export function UtilitiesBillsTable({
  sortedBills,
  filteredBills,
  selectedMonth,
  selectedYear,
  utilitySplitEnabled,
  utilityLabels,
  isReader,
  onEditBill,
  onRefresh,
}: BillsTableProps) {
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const todayStr = today();
  const { householdPayerLabel, partnerPayerLabel } = utilityLabels;

  const billOverdue = (row: UtilityBill) =>
    utilitiesCalculations.isBillOverdue(row, { splitEnabled: utilitySplitEnabled, today: todayStr });

  const columns: DataTableColumn<UtilityBill>[] = [
    {
      key: 'type',
      header: 'Tétel',
      width: '40%',
      cell: (row) => {
        const isOverdue = billOverdue(row);
        const tone =
          hasSettlementDate(row.paidDate) || (utilitySplitEnabled && row.paidBy)
            ? 'success'
            : isOverdue
              ? 'danger'
              : 'warning';
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
      cell: (row) => (
        <BillStatusCell
          bill={row}
          utilitySplitEnabled={utilitySplitEnabled}
          isReader={isReader}
          todayStr={todayStr}
          householdPayerLabel={householdPayerLabel}
          partnerPayerLabel={partnerPayerLabel}
          utilityLabels={utilityLabels}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '14%',
      cell: (row) =>
        !isReader ? (
          <BillRowActions
            bill={row}
            onEdit={onEditBill}
            onDeleted={onRefresh}
            requestDelete={requestDelete}
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
          description="Másold az előző hónapot, töltsd ki sablonból, vagy rögzíts kézzel."
        />
      ) : (
        <DataTable columns={columns} data={sortedBills} rowKey={(row) => row.id} />
      )}
      <ConfirmDeleteModal />
    </Section>
  );
}

/* ── Isolated status cell (handles its own inline mutation) ── */

interface BillStatusCellProps {
  bill: UtilityBill;
  utilitySplitEnabled: boolean;
  isReader: boolean;
  todayStr: string;
  householdPayerLabel: string;
  partnerPayerLabel: string;
  utilityLabels: UtilitySplitLabels;
}

function BillStatusCell({
  bill,
  utilitySplitEnabled,
  isReader,
  todayStr,
  householdPayerLabel,
  partnerPayerLabel,
  utilityLabels,
}: BillStatusCellProps) {
  const patchBill = useUtilitiesStore((s) => s.patchBill);
  const [pending, setPending] = React.useState(false);

  const handleUpdate = async (payload: Record<string, unknown>) => {
    const previous = bill;
    const optimistic = { ...bill, ...payload } as UtilityBill;
    patchBill(bill.id, optimistic);
    setPending(true);
    try {
      const res = await utilitiesClient.update(bill.id, payload);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      patchBill(bill.id, res[1]);
    } catch (error) {
      patchBill(bill.id, previous);
      console.error('[BillStatusCell] update failed', error);
    } finally {
      setPending(false);
    }
  };

  const isOverdue = utilitiesCalculations.isBillOverdue(bill, { splitEnabled: utilitySplitEnabled, today: todayStr });

  if (utilitySplitEnabled) {
    return (
      <ClickableSelect
        value={bill.paidBy || 'Fizetendő'}
        tone={bill.paidBy ? 'success' : 'warning'}
        title={
          bill.paidBy
            ? `${utilitiesCalculations.payerSideLabel(bill.paidBy, utilityLabels)} fizette`
            : 'Ki fizette? Válassz a legördülőből'
        }
        disabled={isReader || pending}
        onChange={(val) => {
          if (val === 'Fizetendő') void handleUpdate({ paidBy: null, paidDate: null });
          else void handleUpdate({ paidBy: val, paidDate: today() });
        }}
        options={[
          { value: 'Fizetendő', label: 'Függőben' },
          { value: 'Mi', label: householdPayerLabel },
          { value: 'Ildi', label: partnerPayerLabel },
        ]}
      />
    );
  }

  return (
    <StatusToggleButton
      status={hasSettlementDate(bill.paidDate) ? 'success' : isOverdue ? 'danger' : 'warning'}
      title={hasSettlementDate(bill.paidDate) ? 'Kifizetve' : isOverdue ? 'Lejárt' : 'Várakozik'}
      pending={pending}
      onClick={() =>
        void handleUpdate({
          paidDate: hasSettlementDate(bill.paidDate) ? null : today(),
        })
      }
    >
      {hasSettlementDate(bill.paidDate) ? (
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
}
