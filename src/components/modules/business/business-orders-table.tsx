'use client';

import { formatHUF, formatDate } from '@/utils';
import { BusinessOrder } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  EmptyState,
  StatusPill,
  EntityCell,
  RowActions,
  type DataTableColumn,
} from '@/components/design';
import {
  ShoppingBag,
  Plus,
  User,
  Truck,
  FileText,
  Calendar,
} from 'lucide-react';
import type { BusinessPageState } from '@/components/modules/business/hooks/use-business-page-state';

type BusinessOrdersTableProps = Pick<
  BusinessPageState,
  'filteredOrders' | 'openForm' | 'deleteOrder' | 'requestDelete'
>;

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
  requestDelete,
}: BusinessOrdersTableProps) {
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
      width: '8%',
      cell: (order) =>
        order.state === 'RENDBEN' ? (
          <StatusPill status="success" dot>Rendben</StatusPill>
        ) : (
          <StatusPill status="warning" dot>Kint</StatusPill>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '8%',
      cell: (order) => (
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
          <Button size="sm" onClick={() => openForm()}>
            <Plus size={13} /> Új rendelés
          </Button>
        }
      />
    );
  }

  return <DataTable columns={orderColumns} data={filteredOrders} rowKey={(o) => o.id} minWidth="900px" />;
}
