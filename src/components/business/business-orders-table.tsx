'use client';

import { useState } from 'react';
import { formatHUF, formatDate } from '@/utils';
import { BusinessOrder } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  EmptyState,
  EntityCell,
  RowActions,
  StatusPill,
  type DataTableColumn,
} from '@/components/design';
import { OptionsSelect } from '@/components/ui/OptionsSelect';
import { resolveOrderStatusTone } from '@/settings/business';
import {
  ShoppingBag,
  Plus,
  User,
  Truck,
  FileText,
  Calendar,
} from 'lucide-react';
import type { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { BusinessSettings } from '@/settings/business';

export type BusinessOrdersTableProps = {
  filteredOrders: BusinessOrder[];
  openForm: (order?: BusinessOrder) => void;
  deleteOrder: (id: number) => void | Promise<void>;
  updateOrderStatus: (id: number, orderStatus: string) => void | Promise<void>;
  requestDelete: ReturnType<typeof useConfirmDelete>['requestDelete'];
  isReader: boolean;
  bizOptions: BusinessSettings;
};

function getChannelIcon(c: string) {
  const l = c.toLowerCase();
  if (l.includes('webshop') || l.includes('shopify')) return ShoppingBag;
  if (l.includes('piac') || l.includes('mesk')) return Truck;
  if (l.includes('privát')) return User;
  return ShoppingBag;
}

export function BusinessOrdersTable({
  filteredOrders,
  openForm,
  deleteOrder,
  updateOrderStatus,
  requestDelete,
  isReader,
  bizOptions,
}: BusinessOrdersTableProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (order: BusinessOrder, orderStatus: string) => {
    const current =
      order.orderStatus?.trim() || bizOptions.order_statuses[0] || '';
    if (current === orderStatus) return;
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, orderStatus);
    } finally {
      setUpdatingId(null);
    }
  };
  const orderColumns: DataTableColumn<BusinessOrder>[] = [
    {
      key: 'customer',
      header: 'Vevő',
      width: '24%',
      cell: (order) => {
        const ChannelIcon = getChannelIcon(order.channel);
        const tone = order.state === 'RENDBEN' ? 'success' : 'warning';
        return (
          <EntityCell
            icon={ChannelIcon}
            tone={tone}
            title={order.customerName}
            subtitle={
              order.shopifyOrderNumber ? (
                <span className="font-mono">{order.shopifyOrderNumber}</span>
              ) : undefined
            }
          />
        );
      },
    },
    {
      key: 'channel',
      header: 'Csatorna',
      width: '14%',
      cell: (order) => <span className="text-xs text-foreground/85">{order.channel}</span>,
    },
    {
      key: 'payment',
      header: 'Fizetés',
      width: '16%',
      cell: (order) => (
        <div className="text-xs">
          <div className="text-foreground/85">{order.paymentMethod}</div>
          <div className="text-muted-foreground text-[10px]">{order.provider}</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Dátum',
      width: '12%',
      cell: (order) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Calendar size={11} strokeWidth={2.2} /> {formatDate(order.date)}
        </span>
      ),
    },
    {
      key: 'invoice',
      header: 'Számla',
      width: '10%',
      cell: (order) =>
        order.invoiceId ? (
          <span className="inline-flex items-center gap-1 text-[0.7rem] font-mono bg-muted/60 text-foreground/75 px-1.5 py-0.5 rounded">
            <FileText size={10} strokeWidth={2.2} /> {order.invoiceId}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: 'amount',
      header: 'Összeg',
      align: 'right',
      width: '12%',
      cell: (order) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">{formatHUF(order.amount)}</span>
      ),
    },
    {
      key: 'state',
      header: 'Státusz',
      align: 'center',
      width: '12%',
      cell: (order) => {
        const label = order.orderStatus?.trim() || bizOptions.order_statuses[0] || '—';
        const tone = resolveOrderStatusTone(bizOptions, label);
        if (isReader) {
          return (
            <StatusPill status={tone} size="xs" dot>
              {label}
            </StatusPill>
          );
        }
        return (
          <OptionsSelect
            value={label}
            onChange={(status) => void handleStatusChange(order, status)}
            options={bizOptions.order_statuses}
            tone={tone}
            className="h-8 min-w-[9rem] text-xs"
            disabled={updatingId === order.id}
          />
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '8%',
      cell: (order) =>
        isReader ? null : (
        <RowActions
          onEdit={() => openForm(order)}
          onDelete={() =>
            requestDelete({
              title: 'Rendelés törlése',
              message: `Biztosan törlöd a „${order.customerName || 'névtelen'}" rendelést? Ez a művelet nem vonható vissza.`,
              onConfirm: () => deleteOrder(order.id),
            })
          }
        />
      ),
    },
  ];

  if (filteredOrders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nincsenek rendelések"
        description="Még nincs rögzített rendelés ebben a hónapban."
        action={
          isReader ? undefined : (
          <Button size="sm" onClick={() => openForm()}>
            <Plus size={13} /> Új rendelés
          </Button>
        )
        }
      />
    );
  }

  return <DataTable columns={orderColumns} data={filteredOrders} rowKey={(o) => o.id} minWidth="900px" />;
}
