'use client';

import { useCallback, useState } from 'react';
import { PageHeader, MetricStrip, SegmentedControl, ModulePageSkeleton } from '@/components/design';
import { List, BarChart3, FolderOpen } from 'lucide-react';
import { useBusinessPageData } from '@/hooks/useBusinessPageData';
import { canEditHousehold } from '@/utils/household-role';
import type { BusinessOrder } from '@/types/business';
import { BusinessMonthlyTab } from './business-monthly-tab';
import { BusinessSummaryTab } from './business-summary-tab';
import { BusinessDocumentsTab } from './business-documents-tab';
import { BusinessVatEstimatePanel } from './business-vat-estimate-panel';
import { BusinessOrderModal } from './business-order-modal';

type OrderModalState = BusinessOrder | 'create' | null;

export function BusinessPage() {
  const data = useBusinessPageData();
  const { ConfirmDeleteModal } = data;

  const [activeTab, setActiveTab] = useState<'monthly' | 'summary' | 'documents'>('monthly');
  const [orderModal, setOrderModal] = useState<OrderModalState>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [realAiAdvice, setRealAiAdvice] = useState<string | null>(null);

  const openForm = useCallback(
    (order?: BusinessOrder) => {
      if (!canEditHousehold(data.user)) return;
      setOrderModal(order ?? 'create');
    },
    [data.user],
  );

  const handleSyncShopify = useCallback(async () => {
    setIsSyncing(true);
    try {
      await data.syncShopify();
    } catch {
      // notification handled in page data
    } finally {
      setIsSyncing(false);
    }
  }, [data]);

  const handleAiAdvice = useCallback(async () => {
    setIsAiLoading(true);
    try {
      await data.requestAiAdvice(setRealAiAdvice);
    } finally {
      setIsAiLoading(false);
    }
  }, [data]);

  const modalOrder = orderModal && orderModal !== 'create' ? orderModal : null;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Vállalkozás' }, { label: data.businessName }]}
        title={`${data.businessName} CRM`}
        description={`${data.selectedYear}. ${String(data.selectedMonth).padStart(2, '0')}. havi rendelések, kintlévőségek és éves trendek`}
        actions={
          <SegmentedControl
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'monthly' | 'summary' | 'documents')}
            options={[
              { value: 'monthly', label: 'Rendelések', icon: List, count: data.filteredOrders.length },
              { value: 'summary', label: 'Éves trendek', icon: BarChart3 },
              { value: 'documents', label: 'Dokumentumok', icon: FolderOpen },
            ]}
          />
        }
      />

      {data.pageLoading ? (
        <ModulePageSkeleton />
      ) : (
        <>
          {activeTab !== 'documents' ? (
            <MetricStrip
              items={activeTab === 'monthly' ? data.monthlyMetrics : data.summaryMetrics}
              columns={4}
              variant="separated"
            />
          ) : null}

          {activeTab === 'monthly' ? (
            <BusinessVatEstimatePanel
              year={data.selectedYear}
              month={data.selectedMonth}
              orders={data.orders}
              bizSettings={data.bizOptions}
            />
          ) : null}

          {activeTab === 'monthly' && (
            <BusinessMonthlyTab
              selectedMonth={data.selectedMonth}
              selectedYear={data.selectedYear}
              filteredOrders={data.filteredOrders}
              shopifyImportEnabled={data.shopifyImportEnabled}
              isSyncing={isSyncing}
              syncShopify={handleSyncShopify}
              openForm={openForm}
              deleteOrder={data.deleteOrder}
              updateOrderStatus={data.updateOrderStatus}
              requestDelete={data.requestDelete}
              isReader={data.isReader}
              bizOptions={data.bizOptions}
            />
          )}
          {activeTab === 'documents' && (
            <BusinessDocumentsTab
              selectedYear={data.selectedYear}
              selectedMonth={data.selectedMonth}
              filteredOrders={data.filteredOrders}
              user={data.user}
              requestDelete={data.requestDelete}
            />
          )}
          {activeTab === 'summary' && (
            <BusinessSummaryTab
              businessName={data.businessName}
              selectedYear={data.selectedYear}
              realAiAdvice={realAiAdvice}
              isAiLoading={isAiLoading}
              requestAiAdvice={handleAiAdvice}
              aiAdvice={data.aiAdvice}
              chartData={data.chartData}
              channelData={data.channelData}
              totalYTD={data.totalYTD}
              orders={data.orders}
              bizSettings={data.bizOptions}
              channelTotal={
                data.bizOptions.tax_regime === 'aam'
                  ? data.annualTaxRevenue.totalAllOrdersNet
                  : data.totalYTD
              }
            />
          )}
        </>
      )}

      <BusinessOrderModal
        open={orderModal !== null}
        order={modalOrder}
        bizOptions={data.bizOptions}
        onClose={() => setOrderModal(null)}
        onSave={data.saveOrder}
      />
      <ConfirmDeleteModal />
    </div>
  );
}
