'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { IconPod } from './IconPod';

export interface ChoiceCardOption {
  id: string;
  label: string;
  subtitle?: string;
  description?: string;
  example?: string;
  icon: LucideIcon;
  gradient?: string;
  bestFor?: string;
}

interface ChoiceCardGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: ChoiceCardOption[];
  className?: string;
}

export function ChoiceCardGroup({ value, onChange, options, className }: ChoiceCardGroupProps) {
  return (
    <div className={classNames('grid grid-cols-1 md:grid-cols-2 gap-3', className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={classNames(
              'group relative overflow-hidden rounded-lg border p-4 text-left transition-all',
              active
                ? 'border-primary/40 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-glow'
                : 'border-border bg-card hover:border-foreground/20 hover:shadow-soft',
            )}
          >
            {active ? (
              <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-primary" />
            ) : null}
            <div className="flex items-start gap-3">
              <div
                className={classNames(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white shadow-sm',
                  opt.gradient ?? 'from-primary to-violet-500',
                )}
              >
                <Icon size={16} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  {active ? <StatusPill status="primary" size="xs">aktív</StatusPill> : null}
                </div>
                {opt.subtitle ? <p className="text-[0.7rem] text-muted-foreground font-medium mt-0.5">{opt.subtitle}</p> : null}
                {opt.description ? <p className="mt-2 text-xs text-muted-foreground/90 leading-relaxed">{opt.description}</p> : null}
                {opt.bestFor ? (
                  <p className="mt-2 text-[0.7rem] text-foreground/70 italic">{opt.bestFor}</p>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
