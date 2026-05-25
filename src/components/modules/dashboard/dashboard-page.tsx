'use client';

import classNames from 'classnames';
import { formatDisplayInitials, formatDisplayName, formatGivenName } from '@/lib/personName';
import { HELP } from '@/lib/helpTexts';
import { PageHeader, MetricStrip, AccentPanel } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import { Sparkles } from 'lucide-react';
import { useDashboardPageState } from '@/components/modules/dashboard/hooks/use-dashboard-page-state';
import { DashboardAlertBanners } from '@/components/modules/dashboard/dashboard-alert-banners';
import { DashboardUnpaidSection } from '@/components/modules/dashboard/dashboard-unpaid-section';
import { DashboardUtilitiesSnapshot } from '@/components/modules/dashboard/dashboard-utilities-snapshot';
import { DashboardSideColumn } from '@/components/modules/dashboard/dashboard-side-column';
import { DashboardBusinessChart } from '@/components/modules/dashboard/dashboard-business-chart';
import { WalletSwitcher } from '@/components/wallets/WalletSwitcher';

export default function DashboardPage() {
  const state = useDashboardPageState();
  const { GreetingIcon } = state;
  const { allowed: canUseAi } = useTierFeature('ai');

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Háztartás' }, { label: state.householdName }]}
        title={`${state.greeting}, ${formatGivenName(state.user?.firstName) || 'Gazda'}`}
        description={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <GreetingIcon size={14} className="text-primary" />
            <span className="capitalize">{state.todayFormatted}</span>
            <span className="text-border">·</span>
            <span>Itt a mai pénzügyi képed.</span>
          </span>
        }
        meta={
          <div className="flex flex-col items-end gap-2">
            <WalletSwitcher />
            {state.householdMembers.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Család</span>
                <div className="flex -space-x-1.5">
                  {state.householdMembers.slice(0, 5).map((member: { id: number; firstName?: string; lastName?: string }) => {
                    const mi = formatDisplayInitials(member.firstName, member.lastName);
                    return (
                      <div
                        key={member.id}
                        title={formatDisplayName(member.firstName, member.lastName)}
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

      <DashboardAlertBanners
        unpaidBills={state.unpaidBills}
        canUse={state.canUse}
        utilitySplitEnabled={state.utilitySplitEnabled}
        rezsiBalance={state.rezsiBalance}
        counterpartyLabel={state.counterpartyLabel}
      />

      {state.primaryMetrics.length > 0 && <MetricStrip items={state.primaryMetrics} columns={4} variant="separated" />}

      {state.secondaryMetrics.length > 0 && (
        <MetricStrip
          items={state.secondaryMetrics}
          columns={Math.min(4, Math.max(2, state.secondaryMetrics.length)) as 2 | 3 | 4}
          variant="separated"
        />
      )}

      <div
        className={classNames(
          'grid grid-cols-1 gap-6',
          state.canUse('budget') ? 'lg:grid-cols-5' : 'lg:grid-cols-2',
        )}
      >
        {state.canUse('budget') && (
          <DashboardUnpaidSection
            unpaidItemsList={state.unpaidItemsList}
            todayStr={state.todayStr}
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
          totalInvestmentsValue={state.totalInvestmentsValue}
        />
      </div>

      <DashboardBusinessChart businessEnabled={state.businessEnabled} chartData={state.chartData} />

      {state.canUse('budget') && (
        canUseAi && state.aiDashboardAdvice ? (
          <AccentPanel
            tone="ai"
            icon={Sparkles}
            title="Heti AI tájékoztató"
            titleInfo={HELP.dashboard.aiBriefing}
            description="Az aktuális adatokra szabott összegzés"
            glow
          >
            {state.aiDashboardAdvice}
          </AccentPanel>
        ) : (
          !canUseAi && (
            <TierGatedAiPanel
              featureLabel="Heti AI tájékoztató"
              icon={Sparkles}
              title="Heti AI tájékoztató"
              titleInfo={HELP.dashboard.aiBriefing}
              description="Az aktuális adatokra szabott összegzés"
              glow
            >
              {null}
            </TierGatedAiPanel>
          )
        )
      )}
    </div>
  );
}
