'use client';

import { Button } from '@/components/ui/button';
import { HELP } from '@/lib/helpTexts';
import {
  PageHeader,
  Section,
  InsightBanner,
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
import { useMetersPageState } from '@/components/modules/meters/hooks/use-meters-page-state';
import { MeterPanel } from '@/components/modules/meters/meter-panel';
import { MetersReadingModal } from '@/components/modules/meters/meters-reading-modal';
import { MetersAiModal } from '@/components/modules/meters/meters-ai-modal';
import { MetersNewMeterModal } from '@/components/modules/meters/meters-new-meter-modal';

export default function MetersPage() {
  const state = useMetersPageState();
  const { ConfirmDeleteModal } = state;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Közmű' }, { label: 'Mérőórák' }]}
        title="Óraállások és trendek"
        description="Mérőóra állások, fogyasztás és AI-alapú becslések."
        actions={
          !state.isReader ? (
            <Button size="sm" onClick={state.openNewMeterModal}>
              <PlusCircle size={13} /> Új mérőóra
            </Button>
          ) : undefined
        }
      />

      {!!state.aiUtilityAnomalies?.anomalies?.length && (
        <AccentPanel
          tone="warning"
          icon={Sparkles}
          title="AI anomáliák ezen a hónapon"
          titleInfo={HELP.meters.aiAnomaly}
          description="A modell az alábbi szokatlan értékeket észlelte"
          action={
            <Button variant="ghost" size="xs" onClick={() => state.fetchAiUtilityAnomalies(state.selectedYear, state.selectedMonth)}>
              <RefreshCw size={11} /> Frissítés
            </Button>
          }
        >
          <ul className="space-y-1.5">
            {state.aiUtilityAnomalies.anomalies.map((a: { meter_id: number; meter_name: string; actual: number; expected: number; reason: string }) => (
              <li key={`${a.meter_id}-${a.actual}`} className="text-foreground/80 flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <b className="font-medium text-foreground">{a.meter_name}</b>: {a.reason}
                </span>
              </li>
            ))}
          </ul>
        </AccentPanel>
      )}

      {Object.keys(state.locationGroups).length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="Még nincs mérőóra"
          description="Adj hozzá egy mérőórát az óraállások és fogyasztás követéséhez."
          action={
            !state.isReader ? (
              <Button size="sm" onClick={state.openNewMeterModal}>
                <PlusCircle size={13} /> Új mérőóra
              </Button>
            ) : undefined
          }
        />
      ) : (
        Object.keys(state.locationGroups).map((loc) => (
          <Section
            key={loc}
            title={
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" />
                {loc}
              </span>
            }
            description={`${state.locationGroups[loc].length} mérőóra`}
          >
            <div className="flex flex-col gap-4">
              {state.locationGroups[loc].map((meter) => (
                <MeterPanel
                  key={meter.id}
                  meter={meter}
                  selectedYear={state.selectedYear}
                  getPreviousYearValue={state.getPreviousYearValue}
                  onAiClick={state.handleAiClick}
                  onEditReading={state.openEdit}
                  onAddReading={state.handleAddReading}
                  onDeleteMeter={state.handleDeleteMeter}
                  onDeleteReading={state.handleDeleteReading}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      <MetersReadingModal {...state} />
      <MetersAiModal {...state} />
      <MetersNewMeterModal {...state} />
      <ConfirmDeleteModal />
    </div>
  );
}
