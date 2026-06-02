'use client';

import { Layers, Lock, Users } from 'lucide-react';
import { motion } from 'motion/react';
import classNames from 'classnames';
import { TierBadge } from '@/components/subscription/TierBadge';
import {
  ONBOARDING_FINANCIAL_MODEL_OPTIONS,
  type FinancialModelId,
} from '@/helpers/household-onboarding';

const MODEL_ICONS: Record<FinancialModelId, React.ComponentType<{ size?: number; className?: string }>> = {
  shared: Users,
  separate: Lock,
  hybrid: Layers,
};

interface OnboardingFinancialModelStepProps {
  value: FinancialModelId | null;
  onChange: (model: FinancialModelId) => void;
}

export function OnboardingFinancialModelStep({ value, onChange }: OnboardingFinancialModelStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Hogyan kezelitek a pénzügyeiteket a pároddal?
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Ez alapján állítjuk be a kasszáitokat. Később bármikor módosíthatod a Beállításokban vagy a kasszaváltóban.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ONBOARDING_FINANCIAL_MODEL_OPTIONS.map((option) => {
          const Icon = MODEL_ICONS[option.id];
          const selected = value === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange(option.id)}
              className={classNames(
                'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors w-full',
                selected
                  ? option.tier
                    ? 'border-violet-500/40 bg-violet-500/[0.07] ring-1 ring-violet-500/15'
                    : 'border-primary bg-primary/10 ring-1 ring-primary/15'
                  : 'border-border bg-muted/20 hover:border-primary/25 hover:bg-muted/40',
              )}
            >
              <div
                className={classNames(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  selected
                    ? option.tier
                      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                      : 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  {option.tier ? <TierBadge tier={option.tier} /> : null}
                </div>
                <p
                  className={classNames(
                    'text-xs mt-1.5 leading-relaxed',
                    selected ? 'text-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {option.description}
                </p>
              </div>
              <div
                className={classNames(
                  'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  selected
                    ? option.tier
                      ? 'border-violet-500 bg-violet-500 text-white'
                      : 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background',
                )}
                aria-hidden
              >
                {selected && <span className="h-2 w-2 rounded-full bg-current" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border px-3 py-2.5 leading-relaxed">
        A Pro csomag privát kasszái később is kipróbálhatók — a varázsló végén segítünk beállítani őket, ha ezt
        választottad.
      </p>
    </div>
  );
}
