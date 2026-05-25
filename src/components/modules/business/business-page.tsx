'use client';

import { useEffect } from 'react';
import {
  PageHeader,
  MetricStrip,
  SegmentedControl,
} from '@/components/design';
import { APP_NAME } from '@/lib/branding';
import { List, BarChart3 } from 'lucide-react';
import { useBusinessPageState } from '@/components/modules/business/hooks/use-business-page-state';
import { BusinessMonthlyTab } from '@/components/modules/business/business-monthly-tab';
import { BusinessSummaryTab } from '@/components/modules/business/business-summary-tab';
import { BusinessOrderModal } from '@/components/modules/business/business-order-modal';

export default function BusinessPage() {
  const state = useBusinessPageState();
  const { ConfirmDeleteModal, businessName } = state;

  useEffect(() => {
    document.title = `${businessName} | ${APP_NAME}`;
  }, [businessName]);

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Vállalkozás' }, { label: businessName }]}
        title={`${businessName} CRM`}
        description={`${state.selectedYear}. ${String(state.selectedMonth).padStart(2, '0')}. havi rendelések, kintlévőségek és éves trendek`}
        actions={
          <SegmentedControl
            value={state.activeTab}
            onChange={(v) => state.setActiveTab(v as 'monthly' | 'summary')}
            options={[
              { value: 'monthly', label: 'Rendelések', icon: List, count: state.filteredOrders.length },
              { value: 'summary', label: 'Éves trendek', icon: BarChart3 },
            ]}
          />
        }
      />

      <MetricStrip items={state.activeTab === 'monthly' ? state.monthlyMetrics : state.summaryMetrics} columns={4} variant="separated" />

      {state.activeTab === 'monthly' && <BusinessMonthlyTab {...state} />}

      {state.activeTab === 'summary' && <BusinessSummaryTab {...state} />}

      <BusinessOrderModal {...state} />
      <ConfirmDeleteModal />
    </div>
  );
}
