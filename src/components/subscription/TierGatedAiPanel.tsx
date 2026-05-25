'use client';

import type { ReactNode } from 'react';
import { AccentPanel } from '@/components/design';
import { TierBadge } from '@/components/subscription/TierBadge';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import { useTierFeature } from '@/components/subscription/TierFeatureGate';
import type { LucideIcon } from 'lucide-react';

interface TierGatedAiPanelProps {
  featureLabel: string;
  title: ReactNode;
  description?: string;
  titleInfo?: string;
  icon: LucideIcon;
  glow?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

export function TierGatedAiPanel({
  featureLabel,
  title,
  description,
  titleInfo,
  icon,
  glow,
  action,
  children,
}: TierGatedAiPanelProps) {
  const { allowed } = useTierFeature('ai');

  if (!allowed) {
    return (
      <AccentPanel
        tone="ai"
        icon={icon}
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {title}
            <TierBadge tier="premium" />
          </span>
        }
        titleInfo={titleInfo}
        description={description}
        glow={glow}
        action={
          action ?? (
            <TierGatedButton feature="ai" featureLabel={featureLabel} variant="ghost" size="xs" showBadge={false}>
              Premium csomag
            </TierGatedButton>
          )
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed opacity-80">
          Ez az AI funkció a Premium csomag része. Frissíts a személyre szabott elemzések és javaslatok használatához.
        </p>
      </AccentPanel>
    );
  }

  return <>{children}</>;
}
