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
import { useUtilitiesPageState } from '@/components/modules/utilities/hooks/use-utilities-page-state';
import {
  SettleDebtButton,
  UnsettleDebtButton,
} from '@/components/modules/utilities/utilities-settlement-buttons';
import { UtilitiesBillsTable } from '@/components/modules/utilities/utilities-bills-table';
import { UtilitiesBillModal } from '@/components/modules/utilities/utilities-bill-modal';

export default function UtilitiesPage() {
  const state = useUtilitiesPageState();
  const { ConfirmDeleteModal } = state;

  const metrics = useMemo(() => {
    if (state.balanceMetricAction === null) return state.metrics;
    const [first, ...rest] = state.metrics;
    const action =
      state.balanceMetricAction === 'unsettle' ? (
        <UnsettleDebtButton loading={state.unsettling} onClick={state.handleUnsettle} />
      ) : (
        <SettleDebtButton loading={state.settling} onClick={state.handleSettlement} />
      );
    return [{ ...first, action }, ...rest];
  }, [
    state.balanceMetricAction,
    state.handleSettlement,
    state.handleUnsettle,
    state.metrics,
    state.settling,
    state.unsettling,
  ]);

  return (
    <div className="flex flex-col gap-7 max-w-[1500px] mx-auto w-full">
      <PageHeader
        breadcrumbs={[{ label: 'Közüzem' }, { label: 'Rezsi' }]}
        title="Rezsi menedzsment"
        description="Automatikus elszámolás, megosztás és kiegyenlítés."
        actions={
          !state.isReader ? (
            <>
              <Button
                variant="outline"
                size="sm"
                loading={state.cloning}
                onClick={() => void state.runClone(() => state.clonePreviousMonth(state.selectedMonth, state.selectedYear))}
              >
                {!state.cloning && <Copy size={13} />} {state.cloning ? 'Másolás…' : 'Múlt havi'}
              </Button>
              {state.utilityTemplates.length > 0 && (
                <Button variant="outline" size="sm" loading={state.templating} onClick={state.handleGenerateFromTemplates}>
                  {!state.templating && <LayoutTemplate size={13} />} {state.templating ? 'Generálás…' : 'Sablonból'}
                </Button>
              )}
              <Button size="sm" onClick={state.openNewBillModal}>
                <Plus size={13} /> Új rögzítés
              </Button>
            </>
          ) : undefined
        }
      />

      {state.monthSettlement && state.utilitySplitEnabled && (
        <AccentPanel
          tone="success"
          icon={UserCheck}
          title="Havi tartozás rendezve"
          titleInfo={HELP.utilities.settlementRecord}
          description={state.monthSettlement.summary}
          action={
            state.isAdmin ? (
              <UnsettleDebtButton loading={state.unsettling} onClick={state.handleUnsettle} />
            ) : undefined
          }
        >
          <div className="text-sm text-foreground/90 space-y-1">
            <p>
              <span className="text-muted-foreground">Dátum:</span>{' '}
              <span className="font-medium tabular-nums">{formatDate(state.monthSettlement.settledAt)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Költségvetésben:</span>{' '}
              <span className="font-medium">
                {state.monthSettlement.direction === 'partner_pays_household' ? 'bevétel' : 'kiadás'}
              </span>
              {' · '}
              <span className="tabular-nums">{formatHUF(state.monthSettlement.amount)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Aktuális egyenleg:</span>{' '}
              <span className="font-medium">
                {state.monthSettlement.direction === 'partner_pays_household' ? 'nőtt' : 'csökkent'} ezzel az összeggel
              </span>
            </p>
          </div>
        </AccentPanel>
      )}

      {state.utilitySplitEnabled && !state.splitPartnerUser && (
        <InsightBanner tone="warning" icon={AlertTriangle} title="A rezsimegosztás be van kapcsolva">
          Nincs másik tag regisztrálva. Hívj meg egy családtagot a Beállítások oldalon. A felület most a fallback{' '}
          <i>&quot;Családtag&quot;</i> nevet használja.
        </InsightBanner>
      )}

      <MetricStrip items={metrics} columns={4} variant="separated" />

      {state.aiUtilityAnomalies?.anomalies && state.aiUtilityAnomalies.anomalies.length > 0 && (
        <AccentPanel
          tone="ai"
          icon={Sparkles}
          title="AI anomáliafigyelés"
          titleInfo={HELP.utilities.aiAnomaly}
          description="A modell az alábbi szokatlan értékeket észlelte"
          action={
            <Button variant="ghost" size="xs" onClick={() => state.fetchAiUtilityAnomalies(state.selectedYear, state.selectedMonth)}>
              <RefreshCw size={11} /> Frissítés
            </Button>
          }
        >
          <ul className="space-y-1.5">
            {state.aiUtilityAnomalies.anomalies.map(
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
      )}

      <UtilitiesBillsTable {...state} />
      <UtilitiesBillModal {...state} />
      <ConfirmDeleteModal />
    </div>
  );
}
