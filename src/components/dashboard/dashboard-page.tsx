'use client';

import { useMemo, type ReactNode } from 'react';
import classNames from 'classnames';
import { formatDisplayInitials, formatDisplayName, formatGivenName } from '@/utils/person-name';
import { HELP } from '@/config/help';
import { PageHeader, MetricStrip, AccentPanel, ModulePageSkeleton } from '@/components/design';
import {
  canLoadDashboardAiCfo,
  canShowDashboardAiBriefing,
  isDashboardContentReady,
} from '@/helpers/dashboard-access';
import { Sparkles } from 'lucide-react';
import { useDashboardPageData } from '@/hooks/useDashboardPageData';
import type { DashboardWidgetId } from '@/settings/dashboard';
import { DashboardAlertBanners } from './dashboard-alert-banners';
import { DashboardUnpaidSection } from './dashboard-unpaid-section';
import { DashboardUtilitiesSnapshot } from './dashboard-utilities-snapshot';
import { DashboardSideColumn } from './dashboard-side-column';
import { DashboardBusinessChart } from './dashboard-business-chart';
import { AiCfoWidget } from './ai-cfo-widget';
import { DashboardTravelWidget } from './dashboard-travel-widget';
import { WalletSwitcherContainer as WalletSwitcher } from '@/components/layout/wallet-switcher-container';
import { useAuthStore } from '@/stores/useAuthStore';
import { aiFeatureLabel } from '@/config/ai-features';

export function DashboardPage() {
  const state = useDashboardPageData();
  const user = useAuthStore((s) => s.user);
  const { GreetingIcon } = state;
  const showAiCfo = canLoadDashboardAiCfo(user);
  const showAiBriefing = canShowDashboardAiBriefing(user);

  const orderedWidgets = useMemo(() => {
    const widgets: Record<DashboardWidgetId, ReactNode | null> = {
      alerts: (
        <DashboardAlertBanners
          key="alerts"
          overdueUnpaidBills={state.overdueUnpaidBills}
          missedIncomeSummary={state.missedIncomeSummary}
          canUse={state.canUse}
          utilitySplitEnabled={state.utilitySplitEnabled}
          rezsiBalance={state.rezsiBalance}
          counterpartyLabel={state.counterpartyLabel}
          receivablesOutstanding={state.receivablesOutstanding}
          receivablesOpenContactCount={state.receivablesOpenContactCount}
          insuranceUpcoming={state.insuranceUpcoming}
          insuranceReminderDays={state.insuranceReminderDays}
          rentalOverdueRents={state.rentalOverdueRents}
          rentalOverdueGraceDays={state.rentalOverdueGraceDays}
          pocketMoneyInterestAlert={state.pocketMoneyInterestAlert}
          businessTaxAlert={state.businessTaxAlert}
          aiUtilityAnomalies={state.aiUtilityAnomalies}
          canLoadUtilityAnomalies={state.canLoadUtilityAnomalies}
          financialDataReady={state.financialDataReady}
          missingMeters={state.missingMeters}
        />
      ),
      ai_cfo: showAiCfo ? (
        <AiCfoWidget
          key="ai_cfo"
          context={state.aiCfoContext}
          financialDataReady={state.financialDataReady}
        />
      ) : null,
      travel_plans: <DashboardTravelWidget key="travel_plans" />,
      primary_metrics:
        state.primaryMetrics.length > 0 ? (
          <MetricStrip key="primary_metrics" items={state.primaryMetrics} columns={4} variant="separated" />
        ) : null,
      secondary_metrics:
        state.secondaryMetrics.length > 0 ? (
          <MetricStrip
            key="secondary_metrics"
            items={state.secondaryMetrics}
            columns={Math.min(4, Math.max(2, state.secondaryMetrics.length)) as 2 | 3 | 4}
            variant="separated"
          />
        ) : null,
      main_grid: (
        <div
          key="main_grid"
          className={classNames(
            'grid grid-cols-1 gap-6',
            state.canUse('budget') ? 'lg:grid-cols-5' : 'lg:grid-cols-2',
          )}
        >
          {state.canUse('budget') && (
            <DashboardUnpaidSection
              unpaidItemsList={state.unpaidItemsList}
              todayStr={state.todayStr}
              exchangeRates={state.exchangeRates}
              handlePayItem={state.handlePayItem}
              isReader={state.isReader}
            />
          )}

          {!state.canUse('budget') && state.canUse('utilities') && (
            <DashboardUtilitiesSnapshot
              monthBills={state.monthBills}
              todayStr={state.todayStr}
              utilitySplitEnabled={state.utilitySplitEnabled}
            />
          )}

          <DashboardSideColumn
            canUse={state.canUse}
            consumptionData={state.consumptionData}
            investments={state.investments}
            investmentPayouts={state.investmentPayouts}
            showMetersConsumption={state.metersShowAnnualOnDashboard}
          />
        </div>
      ),
      business_chart: (
        <DashboardBusinessChart key="business_chart" businessEnabled={state.businessEnabled} chartData={state.chartData} />
      ),
      ai_briefing:
        showAiBriefing && state.aiDashboardAdvice ? (
          <AccentPanel
            key="ai_briefing"
            tone="ai"
            icon={Sparkles}
            title={aiFeatureLabel('weekly_report')}
            titleInfo={HELP.dashboard.aiBriefing}
            description="Az aktuális adatokra szabott összegzés"
            glow
          >
            {state.aiDashboardAdvice}
          </AccentPanel>
        ) : null,
    };

    return state.dashboardWidgetOrder
      .map((id) => widgets[id])
      .filter((node): node is ReactNode => node != null);
  }, [state, showAiBriefing, showAiCfo]);

  const contentReady = isDashboardContentReady({
    financialDataReady: state.financialDataReady,
    canUse: state.canUse,
    activeWalletId: state.activeWalletId,
  });

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Háztartás' }, { label: state.householdName }]}
        title={`${state.greeting}, ${formatGivenName(state.user?.first_name) || 'Gazda'}`}
        description={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <GreetingIcon size={14} className="text-primary" />
            <span className="capitalize">{state.todayFormatted}</span>
            <span className="text-border">·</span>
            <span>Itt a mai pénzügyi képed.</span>
          </span>
        }
        meta={
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:items-end">
            <WalletSwitcher className="w-full sm:w-auto" />
            {state.householdMembers.length > 0 ? (
              <div className="flex items-center gap-2 self-start sm:self-end">
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Család</span>
                <div className="flex -space-x-1.5">
                  {state.householdMembers.slice(0, 5).map((member) => {
                    const mi = formatDisplayInitials(member.first_name, member.last_name);
                    return (
                      <div
                        key={member.id}
                        title={formatDisplayName(member.first_name, member.last_name)}
                        className="h-6 w-6 rounded-full bg-muted text-[0.6rem] font-semibold text-foreground flex items-center justify-center ring-2 ring-background"
                      >
                        {mi}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        }
      />

      {contentReady ? (
        orderedWidgets
      ) : (
        <ModulePageSkeleton metrics={4} tableRows={6} />
      )}
    </div>
  );
}
