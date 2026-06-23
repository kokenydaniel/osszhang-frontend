'use client';

import { AccentPanel } from '@/components/design';
import { HELP } from '@/config/help';
import { formatTransportDetail } from '@/calculations/travel';
import { formatHUF } from '@/utils';
import type { AiTravelTransportDetail } from '@/types/ai';
import { Car, Plane } from 'lucide-react';

type TravelTransportPanelProps = {
  detail?: AiTravelTransportDetail;
  plain?: boolean;
};

export function TravelTransportPanel({ detail, plain = false }: TravelTransportPanelProps) {
  if (!detail) return null;

  const Icon = detail.mode === 'car' ? Car : Plane;

  const content = (
    <div className="space-y-3 text-sm">
      <p className="font-medium text-foreground">{formatHUF(detail.estimated_cost)}</p>
      <p className="text-muted-foreground leading-relaxed">{detail.description}</p>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        {formatTransportDetail(detail).slice(1).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );

  if (plain) return content;

  return (
    <AccentPanel
      tone="info"
      icon={Icon}
      title="Közlekedés költsége"
      description={detail.already_booked ? 'Már lefoglalva — nincs extra közlekedési tétel' : HELP.travel.transportMode}
    >
      {content}
    </AccentPanel>
  );
}
