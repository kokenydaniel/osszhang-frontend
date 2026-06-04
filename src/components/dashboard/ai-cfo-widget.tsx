'use client';

import { AccentPanel } from '@/components/design';
import { TierGatedAiPanel } from '@/components/subscription/TierGatedAiPanel';
import { Button } from '@/components/ui/button';
import { useAiCfoWidget } from '@/hooks/useAiCfoWidget';
import { AiCfoLoadingState } from './ai-cfo-loading-state';
import { AlertTriangle, Bot, Lightbulb, RefreshCw } from 'lucide-react';
import { aiFeatureLabel } from '@/config/ai-features';
import type { AiCfoContextPayload } from '@/types';

interface AiCfoWidgetProps {
  context: AiCfoContextPayload | null;
  financialDataReady: boolean;
  enabled?: boolean;
}

export function AiCfoWidget({ context, financialDataReady, enabled = true }: AiCfoWidgetProps) {
  const { brief, isLoading, waitingForData, reload } = useAiCfoWidget(context, financialDataReady, enabled);

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return (
      <TierGatedAiPanel
        featureLabel={aiFeatureLabel('monthly_advisor')}
        icon={Bot}
        title={aiFeatureLabel('monthly_advisor')}
        description="Személyre szabott havi összefoglaló, tanácsok és figyelmeztetések a rögzített adataidból"
        glow
      >
        <AiCfoLoadingState waitingForData={waitingForData} />
      </TierGatedAiPanel>
    );
  }

  if (!brief) {
    return null;
  }

  return (
    <TierGatedAiPanel
      featureLabel={aiFeatureLabel('monthly_advisor')}
      icon={Bot}
      title={aiFeatureLabel('monthly_advisor')}
      description="Személyre szabott havi összefoglaló, tanácsok és figyelmeztetések a rögzített adataidból"
      glow
      action={
        <Button type="button" variant="ghost" size="sm" onClick={() => reload()} className="gap-1.5">
          <RefreshCw size={14} />
          Frissítés
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-foreground">{brief.summary}</p>

        {brief.tips.length > 0 ? (
          <AccentPanel tone="info" icon={Lightbulb} title="Tanácsok" className="!shadow-none">
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
              {brief.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </AccentPanel>
        ) : null}

        {brief.warnings.length > 0 ? (
          <AccentPanel tone="warning" icon={AlertTriangle} title="Figyelmeztetések" className="!shadow-none">
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
              {brief.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AccentPanel>
        ) : null}
      </div>
    </TierGatedAiPanel>
  );
}
