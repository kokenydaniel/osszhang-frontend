'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HELP } from '@/config/help';
import {
  PageHeader,
  Section,
  AccentPanel,
  EmptyState,
  ModulePageSkeleton,
} from '@/components/design';
import { MapPin, RefreshCw, Sparkles, PlusCircle, Gauge } from 'lucide-react';
import { useMetersPageData } from '@/hooks/useMetersPageData';
import { canEditHousehold } from '@/utils/household-role';
import { MeterPanel } from './meter-panel';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import {
  MetersReadingModal,
  type MetersReadingModalTarget,
} from './meters-reading-modal';
import { MetersAiModal } from './meters-ai-modal';
import { MetersNewMeterModal } from './meters-new-meter-modal';
import type { Meter, MeterReading } from '@/types';

export function MetersPage() {
  const data = useMetersPageData();
  const { ConfirmDeleteModal } = data;

  const [newMeterOpen, setNewMeterOpen] = useState(false);
  const [readingModal, setReadingModal] = useState<MetersReadingModalTarget>(null);
  const [aiMeterId, setAiMeterId] = useState<number | null>(null);

  const openNewMeter = () => {
    if (!canEditHousehold(data.user)) return;
    setNewMeterOpen(true);
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Közmű' }, { label: 'Mérőórák' }]}
        title="Óraállások és trendek"
        description="Mérőóra állások, fogyasztás és AI-alapú becslések."
        actions={
          !data.isReader ? (
            <Button size="sm" onClick={openNewMeter}>
              <PlusCircle size={13} /> Új mérőóra
            </Button>
          ) : undefined
        }
      />

      {data.pageLoading ? (
        <ModulePageSkeleton metrics={0} tableRows={4} />
      ) : (
        <>
          {data.missingReadingsCount > 0 && (
            <AccentPanel
              tone="danger"
              icon={Gauge}
              title="Aktuális leolvasások esedékesek"
              description={`A beállításokban megadott leolvasási dátum elmúlt, és még ${data.missingReadingsCount} db órához nem rögzítetted a tárgyhavi állást.`}
            >
              {null}
            </AccentPanel>
          )}

          {data.canLoadAnomalies && !!data.aiUtilityAnomalies?.anomalies?.length ? (
            <AccentPanel
              tone="warning"
              icon={Sparkles}
              title="AI anomáliák ezen a hónapon"
              titleInfo={HELP.meters.aiAnomaly}
              description="A modell az alábbi szokatlan értékeket észlelte"
            >
              <ul className="space-y-1.5">
                {data.aiUtilityAnomalies.anomalies.map((a) => (
                  <li key={`${a.meter_id}-${a.actual}`} className="text-foreground/80 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>
                      <b className="font-medium text-foreground">{a.meter_name}</b>: {a.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </AccentPanel>
          ) : !data.canLoadAnomalies ? (
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

          {Object.keys(data.locationGroups).length === 0 ? (
            <EmptyState
              icon={Gauge}
              title="Még nincs mérőóra"
              description="Adj hozzá egy mérőórát az óraállások és fogyasztás követéséhez."
              action={
                !data.isReader ? (
                  <Button size="sm" onClick={openNewMeter}>
                    <PlusCircle size={13} /> Új mérőóra
                  </Button>
                ) : undefined
              }
            />
          ) : (
            Object.keys(data.locationGroups).map((loc) => (
              <Section
                key={loc}
                title={
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={12} className="text-primary" />
                    {loc}
                  </span>
                }
                description={`${data.locationGroups[loc].length} mérőóra`}
              >
                <div className="flex flex-col gap-4">
                  {data.locationGroups[loc].map((meter) => (
                    <MeterPanel
                      key={meter.id}
                      meter={meter}
                      selectedYear={data.selectedYear}
                      getPreviousYearValue={data.getPreviousYearValue}
                      isReader={data.isReader}
                      onQuickReadingSubmit={data.recordQuickReading}
                      onAiClick={setAiMeterId}
                      onEditReading={(m: Meter, r: MeterReading) =>
                        setReadingModal({ mode: 'edit', meter: m, reading: r })
                      }
                      onAddReading={(m: Meter) => setReadingModal({ mode: 'create', meter: m })}
                      onDeleteMeter={data.requestDeleteMeter}
                      onDeleteReading={data.requestDeleteReading}
                      onDeleteReadingsBulk={data.requestDeleteReadingsBulk}
                    />
                  ))}
                </div>
              </Section>
            ))
          )}
        </>
      )}

      <MetersReadingModal
        open={readingModal !== null}
        target={readingModal}
        meters={data.meters}
        onClose={() => setReadingModal(null)}
        onSave={async (meterId, values, editingId) => {
          try {
            await data.saveReading(meterId, values, editingId);
          } catch {
            throw new Error();
          }
        }}
      />

      <MetersAiModal
        open={aiMeterId !== null}
        meterId={aiMeterId ?? 0}
        initialYear={data.selectedYear}
        initialMonth={data.selectedMonth}
        onClose={() => setAiMeterId(null)}
        onEstimateMonth={async (year, month) => {
          if (aiMeterId === null) return;
          try {
            await data.estimateAiMonth(aiMeterId, year, month);
          } catch {
            throw new Error();
          }
        }}
        onFillAllGaps={async (meterId) => {
          try {
            await data.fillAllGaps(meterId);
          } catch {
            throw new Error();
          }
        }}
      />

      <MetersNewMeterModal
        open={newMeterOpen}
        metersSettings={data.metersSettings}
        onClose={() => setNewMeterOpen(false)}
        onCreate={data.createMeter}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
