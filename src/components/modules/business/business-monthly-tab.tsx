'use client';

import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Section } from '@/components/design';
import { Plus, RefreshCw } from 'lucide-react';
import type { BusinessPageState } from '@/components/modules/business/hooks/use-business-page-state';
import { BusinessOrdersTable } from '@/components/modules/business/business-orders-table';

type BusinessMonthlyTabProps = Pick<
  BusinessPageState,
  | 'selectedMonth'
  | 'selectedYear'
  | 'filteredOrders'
  | 'shopifyImportEnabled'
  | 'isSyncing'
  | 'handleShopifySync'
  | 'openForm'
  | 'deleteOrder'
  | 'requestDelete'
>;

export function BusinessMonthlyTab({
  selectedMonth,
  selectedYear,
  filteredOrders,
  shopifyImportEnabled,
  isSyncing,
  handleShopifySync,
  openForm,
  deleteOrder,
  requestDelete,
}: BusinessMonthlyTabProps) {
  return (
    <Section
      title={`Rendelések · ${selectedYear}. ${String(selectedMonth).padStart(2, '0')}.`}
      description="Rendelési napló — manuális rögzítés vagy opcionális Shopify import"
      action={
        <div className="flex items-center gap-2">
          <UiTooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShopifySync}
                  disabled={isSyncing || !shopifyImportEnabled}
                >
                  <RefreshCw size={13} className={classNames(isSyncing && 'animate-spin')} />
                  {isSyncing ? 'Szinkron…' : 'Shopify import'}
                </Button>
              </span>
            </TooltipTrigger>
            {!shopifyImportEnabled && (
              <TooltipContent side="bottom" className="max-w-xs text-center">
                A Shopify import ki van kapcsolva. Kapcsold be a Beállítások → Modulok → Vállalkozás menüpontban, ha használni szeretnéd.
              </TooltipContent>
            )}
          </UiTooltip>
          <Button size="sm" onClick={() => openForm()}>
            <Plus size={13} /> Új rendelés
          </Button>
        </div>
      }
    >
      <BusinessOrdersTable
        filteredOrders={filteredOrders}
        openForm={openForm}
        deleteOrder={deleteOrder}
        requestDelete={requestDelete}
      />
    </Section>
  );
}
