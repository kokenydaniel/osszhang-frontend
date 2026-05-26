'use client';

import { useMemo } from 'react';
import { formatHUF, formatDate } from '@/utils';
import { Button } from '@/components/ui/button';
import { HELP } from '@/lib/helpTexts';
import {
  PageHeader,
  MetricStrip,
  InsightBanner,
  AccentPanel,
  ModulePageSkeleton,
} from '@/components/design';
import {
  AlertTriangle,
  Copy,
  LayoutTemplate,
  Plus,
  RefreshCw,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useUtilitiesLogic } from '@/components/modules/utilities/hooks/useUtilitiesLogic';
import {
  SettleDebtButton,
  UnsettleDebtButton,
} from '@/components/modules/utilities/utilities-settlement-buttons';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { UtilitiesBillsTable } from '@/components/modules/utilities/utilities-bills-table';
import { UtilitiesBillModal } from '@/components/modules/utilities/utilities-bill-modal';

export default function UtilitiesPage() {
  const logic = useUtilitiesLogic();
  const { ConfirmDeleteModal } = logic;

  const metrics = useMemo(() => {
    if (logic.balanceMetricAction === null) return logic.metrics;
    const [first, ...rest] = logic.metrics;
    const action =
      logic.balanceMetricAction === 'unsettle' ? (
        <UnsettleDebtButton loading={logic.unsettling} onClick={logic.unsettleMonth} />
      ) : (
        <SettleDebtButton loading={logic.settling} onClick={logic.settleMonth} />
      );
    return [{ ...first, action }, ...rest];
  }, [
    logic.balanceMetricAction,
    logic.metrics,
    logic.settleMonth,
    logic.settling,
    logic.unsettleMonth,
    logic.unsettling,
  ]);

  return (
    <div className="flex flex-col gap-7 max-w-[1500px] mx-auto w-full">
      <PageHeader
        breadcrumbs={[{ label: 'Közüzem' }, { label: 'Rezsi' }]}
        title="Rezsi menedzsment"
        description="Automatikus elszámolás, megosztás és kiegyenlítés."
        actions={
          !logic.isReader ? (
            <>
              <Button
                variant="outline"
                size="sm"
                loading={logic.cloning}
                onClick={() =>
                  void logic.runClone(() => logic.clonePreviousMonth(logic.selectedMonth, logic.selectedYear))
                }
              >
                {!logic.cloning && <Copy size={13} />} {logic.cloning ? 'Másolás…' : 'Múlt havi'}
              </Button>
              {logic.utilityTemplates.length > 0 && (
                <Button variant="outline" size="sm" loading={logic.templating} onClick={logic.generateFromTemplates}>
                  {!logic.templating && <LayoutTemplate size={13} />} {logic.templating ? 'Generálás…' : 'Sablonból'}
                </Button>
              )}
              <Button size="sm" onClick={logic.openNewBillModal}>
                <Plus size={13} /> Új rögzítés
              </Button>
            </>
          ) : undefined
        }
      />

      {logic.pageLoading ? (
        <ModulePageSkeleton />
      ) : (
        <>
      {logic.monthSettlement && logic.utilitySplitEnabled && (
        <AccentPanel
          tone="success"
          icon={UserCheck}
          title="Havi tartozás rendezve"
          titleInfo={HELP.utilities.settlementRecord}
          description={logic.monthSettlement.summary}
          action={
            logic.isAdmin ? (
              <UnsettleDebtButton loading={logic.unsettling} onClick={logic.unsettleMonth} />
            ) : undefined
          }
        >
          <div className="text-sm text-foreground/90 space-y-1">
            <p>
              <span className="text-muted-foreground">Dátum:</span>{' '}
              <span className="font-medium tabular-nums">{formatDate(logic.monthSettlement.settledAt)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Költségvetésben:</span>{' '}
              <span className="font-medium">
                {logic.monthSettlement.direction === 'partner_pays_household' ? 'bevétel' : 'kiadás'}
              </span>
              {' · '}
              <span className="tabular-nums">{formatHUF(logic.monthSettlement.amount)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Aktuális egyenleg:</span>{' '}
              <span className="font-medium">
                {logic.monthSettlement.direction === 'partner_pays_household' ? 'nőtt' : 'csökkent'} ezzel az összeggel
              </span>
            </p>
          </div>
        </AccentPanel>
      )}

      {logic.utilitySplitEnabled && !logic.splitPartnerUser && (
        <InsightBanner tone="warning" icon={AlertTriangle} title="A rezsimegosztás be van kapcsolva">
          Nincs másik tag regisztrálva. Hívj meg egy családtagot a Beállítások oldalon. A felület most a fallback{' '}
          <i>&quot;Családtag&quot;</i> nevet használja.
        </InsightBanner>
      )}

      <MetricStrip items={metrics} columns={4} variant="separated" />

      {logic.canUseAi && logic.aiUtilityAnomalies?.anomalies && logic.aiUtilityAnomalies.anomalies.length > 0 ? (
        <AccentPanel
          tone="ai"
          icon={Sparkles}
          title="AI anomáliafigyelés"
          titleInfo={HELP.utilities.aiAnomaly}
          description="A modell az alábbi szokatlan értékeket észlelte"
          action={
            <Button variant="ghost" size="xs" onClick={() => void logic.refreshAiAnomalies()}>
              <RefreshCw size={11} /> Frissítés
            </Button>
          }
        >
          <ul className="space-y-1.5">
            {logic.aiUtilityAnomalies.anomalies.map(
              (an: { meter_id: number; meter_name: string; actual: number; expected: number; reason: string }) => (
                <li key={`${an.meter_id}-${an.actual}`} className="text-foreground/80 flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    <b className="font-medium text-foreground">{an.meter_name}</b>: {an.reason}{' '}
                    <span className="text-muted-foreground">
                      (tény: {an.actual}, várható: {Math.round(an.expected)})
                    </span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </AccentPanel>
      ) : !logic.canUseAi ? (
        <TierGatedAiPanel
          featureLabel="AI anomáliafigyelés"
          icon={Sparkles}
          title="AI anomáliafigyelés"
          titleInfo={HELP.utilities.aiAnomaly}
          description="A modell szokatlan rezsiértékeket keres a havi adatokban"
          action={
            <TierGatedButton feature="ai" featureLabel="AI anomáliafigyelés" variant="ghost" size="xs" showBadge={false}>
              Premium csomag
            </TierGatedButton>
          }
        >
          {null}
        </TierGatedAiPanel>
      ) : null}

      <UtilitiesBillsTable
        sortedBills={logic.sortedBills}
        filteredBills={logic.filteredBills}
        selectedMonth={logic.selectedMonth}
        selectedYear={logic.selectedYear}
        utilitySplitEnabled={logic.utilitySplitEnabled}
        utilityLabels={logic.utilityLabels}
        isReader={logic.isReader}
        todayStr={logic.todayStr}
        onEditBill={logic.openEditBill}
        onDeleteBill={logic.deleteBill}
        onUpdateBill={logic.updateBill}
        requestDelete={logic.requestDelete}
        wrapBillPending={logic.wrapBillPending}
        isBillPending={logic.isBillPending}
        cloning={logic.cloning}
        runClone={logic.runClone}
        onClonePreviousMonth={logic.clonePreviousMonth}
        templating={logic.templating}
        onGenerateFromTemplates={logic.generateFromTemplates}
        utilityTemplates={logic.utilityTemplates}
      />
        </>
      )}
      <UtilitiesBillModal
        utilitySplitEnabled={logic.utilitySplitEnabled}
        settlementOptions={logic.settlementOptions}
        householdSideLabel={logic.householdSideLabel}
        partnerSideLabel={logic.partnerSideLabel}
        onSubmit={logic.saveBill}
        saving={logic.billSaving}
      />
      <ConfirmDeleteModal />
    </div>
  );
}
