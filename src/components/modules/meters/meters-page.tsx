'use client';

import { Button } from '@/components/ui/button';
import { HELP } from '@/lib/helpTexts';
import {
  PageHeader,
  Section,
  AccentPanel,
  EmptyState,
} from '@/components/design';
import {
  MapPin,
  RefreshCw,
  Sparkles,
  PlusCircle,
  Gauge,
} from 'lucide-react';
import { useMetersLogic } from '@/components/modules/meters/hooks/useMetersLogic';
import { MeterPanel } from '@/components/modules/meters/meter-panel';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { MetersReadingModal } from '@/components/modules/meters/meters-reading-modal';
import { MetersAiModal } from '@/components/modules/meters/meters-ai-modal';
import { MetersNewMeterModal } from '@/components/modules/meters/meters-new-meter-modal';

export default function MetersPage() {
  const logic = useMetersLogic();
  const { ConfirmDeleteModal } = logic;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Közmű' }, { label: 'Mérőórák' }]}
        title="Óraállások és trendek"
        description="Mérőóra állások, fogyasztás és AI-alapú becslések."
        actions={
          !logic.isReader ? (
            <Button size="sm" onClick={logic.openNewMeterModal}>
              <PlusCircle size={13} /> Új mérőóra
            </Button>
          ) : undefined
        }
      />

      {logic.canUseAi && !!logic.aiUtilityAnomalies?.anomalies?.length ? (
        <AccentPanel
          tone="warning"
          icon={Sparkles}
          title="AI anomáliák ezen a hónapon"
          titleInfo={HELP.meters.aiAnomaly}
          description="A modell az alábbi szokatlan értékeket észlelte"
          action={
            <Button variant="ghost" size="xs" onClick={() => logic.fetchAiUtilityAnomalies(logic.selectedYear, logic.selectedMonth)}>
              <RefreshCw size={11} /> Frissítés
            </Button>
          }
        >
          <ul className="space-y-1.5">
            {logic.aiUtilityAnomalies.anomalies.map((a: { meter_id: number; meter_name: string; actual: number; expected: number; reason: string }) => (
              <li key={`${a.meter_id}-${a.actual}`} className="text-foreground/80 flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <b className="font-medium text-foreground">{a.meter_name}</b>: {a.reason}
                </span>
              </li>
            ))}
          </ul>
        </AccentPanel>
      ) : !logic.canUseAi ? (
        <TierGatedAiPanel
          featureLabel="AI anomáliafigyelés"
          icon={Sparkles}
          title="AI anomáliák ezen a hónapon"
          titleInfo={HELP.meters.aiAnomaly}
          description="A modell szokatlan fogyasztási értékeket keres"
          action={
            <TierGatedButton feature="ai" featureLabel="AI anomáliafigyelés" variant="ghost" size="xs" showBadge={false}>
              Premium csomag
            </TierGatedButton>
          }
        >
          {null}
        </TierGatedAiPanel>
      ) : null}

      {Object.keys(logic.locationGroups).length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="Még nincs mérőóra"
          description="Adj hozzá egy mérőórát az óraállások és fogyasztás követéséhez."
          action={
            !logic.isReader ? (
              <Button size="sm" onClick={logic.openNewMeterModal}>
                <PlusCircle size={13} /> Új mérőóra
              </Button>
            ) : undefined
          }
        />
      ) : (
        Object.keys(logic.locationGroups).map((loc) => (
          <Section
            key={loc}
            title={
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" />
                {loc}
              </span>
            }
            description={`${logic.locationGroups[loc].length} mérőóra`}
          >
            <div className="flex flex-col gap-4">
              {logic.locationGroups[loc].map((meter) => (
                <MeterPanel
                  key={meter.id}
                  meter={meter}
                  selectedYear={logic.selectedYear}
                  getPreviousYearValue={logic.getPreviousYearValue}
                  isReader={logic.isReader}
                  showHistory={logic.expandedHistory[meter.id] ?? false}
                  showFullHistory={logic.expandedFullHistory[meter.id] ?? false}
                  calcValue={logic.calcValues[meter.id] ?? ''}
                  onToggleHistory={() => logic.toggleHistory(meter.id)}
                  onExpandFullHistory={() => logic.expandFullHistory(meter.id)}
                  onCalcValueChange={(value) => logic.setCalcValue(meter.id, value)}
                  onQuickReadingSubmit={logic.recordQuickReading}
                  onAiClick={logic.openAiModal}
                  onEditReading={logic.openEditReading}
                  onAddReading={logic.openAddReading}
                  onDeleteMeter={logic.requestDeleteMeter}
                  onDeleteReading={logic.requestDeleteReading}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      <MetersReadingModal meters={logic.meters} onSubmit={logic.saveReading} />
      <MetersAiModal onSubmit={logic.estimateAiMonth} onFillAllGaps={logic.fillAllGaps} />
      <MetersNewMeterModal
        metersSettings={logic.metersSettings}
        onSubmit={logic.saveMeter}
        onApplyTemplate={logic.applyMeterTemplate}
      />
      <ConfirmDeleteModal />
    </div>
  );
}
