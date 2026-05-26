'use client';

import { PageHeader, MetricStrip, SegmentedControl, ModulePageSkeleton } from '@/components/design';
import { List, BarChart3 } from 'lucide-react';
import { useBusinessLogic } from '@/components/modules/business/hooks/useBusinessLogic';
import { useBusinessUi } from '@/components/modules/business/BusinessUiContext';
import { BusinessMonthlyTab } from '@/components/modules/business/business-monthly-tab';
import { BusinessSummaryTab } from '@/components/modules/business/business-summary-tab';
import { BusinessOrderModal } from '@/components/modules/business/business-order-modal';

export default function BusinessPage() {
  const logic = useBusinessLogic();
  const ui = useBusinessUi();
  const { ConfirmDeleteModal } = logic;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Vállalkozás' }, { label: logic.businessName }]}
        title={`${logic.businessName} CRM`}
        description={`${logic.selectedYear}. ${String(logic.selectedMonth).padStart(2, '0')}. havi rendelések, kintlévőségek és éves trendek`}
        actions={
          <SegmentedControl
            value={ui.activeTab}
            onChange={(value) => ui.setActiveTab(value as 'monthly' | 'summary')}
            options={[
              { value: 'monthly', label: 'Rendelések', icon: List, count: logic.filteredOrders.length },
              { value: 'summary', label: 'Éves trendek', icon: BarChart3 },
            ]}
          />
        }
      />

      {logic.pageLoading ? (
        <ModulePageSkeleton />
      ) : (
        <>
      <MetricStrip
        items={ui.activeTab === 'monthly' ? logic.monthlyMetrics : logic.summaryMetrics}
        columns={4}
        variant="separated"
      />

      {ui.activeTab === 'monthly' && <BusinessMonthlyTab {...logic} />}
      {ui.activeTab === 'summary' && <BusinessSummaryTab {...logic} />}
        </>
      )}

      <BusinessOrderModal bizOptions={logic.bizOptions} onSubmit={logic.saveOrder} saving={logic.orderSaving} />
      <ConfirmDeleteModal />
    </div>
  );
}
