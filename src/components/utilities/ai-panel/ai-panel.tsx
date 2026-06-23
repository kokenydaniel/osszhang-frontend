'use client';

import React, { useState, useCallback } from 'react';

import { canLoadUtilityAnomalies } from '@/helpers/dashboard-access';
import { useAuthStore } from '@/stores/useAuthStore';
import { HELP } from '@/config/help';
import { AccentPanel } from '@/components/design';
import { Button } from '@/components/ui/button';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { ensureUtilityAnomaliesLoaded } from '@/helpers/utility-anomalies-loader';
import { RefreshCw, Sparkles } from 'lucide-react';

interface AiPanelProps {
  selectedMonth: number;
  selectedYear: number;
}

export function UtilitiesAiPanel({ selectedMonth, selectedYear }: AiPanelProps) {
  const { user } = useAuthStore();
  const canLoadAnomalies = canLoadUtilityAnomalies(user);

  const [anomalies, setAnomalies] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ensureUtilityAnomaliesLoaded(selectedYear, selectedMonth, { force: true });
      setAnomalies(data);
    } catch (error) {
      console.error('[UtilitiesAiPanel] refresh failed', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  if (!canLoadAnomalies) {
    return (
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
    );
  }

  if (!anomalies?.anomalies?.length) return null;

  return (
    <AccentPanel
      tone="ai"
      icon={Sparkles}
      title="AI anomáliafigyelés"
      titleInfo={HELP.utilities.aiAnomaly}
      description="A modell az alábbi szokatlan értékeket észlelte"
      action={
        <Button variant="ghost" size="xs" loading={loading} onClick={() => void refresh()}>
          <RefreshCw size={11} /> Frissítés
        </Button>
      }
    >
      <ul className="space-y-1.5">
        {anomalies.anomalies.map(
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
  );
}
