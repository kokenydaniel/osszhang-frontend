'use client';

import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Section } from '@/components/design';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import { Plus, RefreshCw } from 'lucide-react';
import type { BusinessOrder } from '@/types/business';
import type { BusinessSettings } from '@/settings/business';
import type { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { BusinessOrdersTable } from './business-orders-table';

export type BusinessMonthlyTabProps = {
  selectedMonth: number;
  selectedYear: number;
  filteredOrders: BusinessOrder[];
  shopifyImportEnabled: boolean;
  isSyncing: boolean;
  syncShopify: () => void | Promise<void>;
  openForm: (order?: BusinessOrder) => void;
  deleteOrder: (id: number) => void | Promise<void>;
  requestDelete: ReturnType<typeof useConfirmDelete>['requestDelete'];
  isReader: boolean;
  bizOptions: BusinessSettings;
};

export function BusinessMonthlyTab({
  selectedMonth,
  selectedYear,
  filteredOrders,
  shopifyImportEnabled,
  isSyncing,
  syncShopify,
  openForm,
  deleteOrder,
  requestDelete,
  isReader,
  bizOptions,
}: BusinessMonthlyTabProps) {
  const { allowed: shopifyAllowed } = useTierFeature('shopify_import');

  return (
    <Section
      title={`Rendelések · ${selectedYear}. ${String(selectedMonth).padStart(2, '0')}.`}
      description="Rendelési napló — manuális rögzítés vagy opcionális Shopify import"
      action={
        !isReader ? (
        <div className="flex items-center gap-2">
          <UiTooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <TierGatedButton
                  feature="shopify_import"
                  featureLabel="Shopify import"
                  variant="outline"
                  size="sm"
                  onClick={syncShopify}
                  disabled={isSyncing || !shopifyImportEnabled || !shopifyAllowed}
                >
                  <RefreshCw size={13} className={classNames(isSyncing && 'animate-spin')} />
                  {isSyncing ? 'Szinkron…' : 'Shopify import'}
                </TierGatedButton>
              </span>
            </TooltipTrigger>
            {!shopifyImportEnabled && shopifyAllowed && (
              <TooltipContent side="bottom" className="max-w-xs text-center">
                A Shopify import ki van kapcsolva. Kapcsold be a Beállítások → Modulok → Vállalkozás menüpontban, ha használni szeretnéd.
              </TooltipContent>
            )}
          </UiTooltip>
          <Button size="sm" onClick={() => openForm()}>
            <Plus size={13} /> Új rendelés
          </Button>
        </div>
        ) : undefined
      }
    >
      <BusinessOrdersTable
        filteredOrders={filteredOrders}
        openForm={openForm}
        deleteOrder={deleteOrder}
        requestDelete={requestDelete}
        isReader={isReader}
        bizOptions={bizOptions}
      />
    </Section>
  );
}
