'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/subscription/TierBadge';
import classNames from 'classnames';

export function ModuleFeatureCard({
  title,
  description,
  enabled,
  onToggle,
  icon,
  iconClassName,
  tierBadge,
  children,
  footer,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  icon: React.ReactNode;
  iconClassName?: string;
  tierBadge?: 'pro' | 'premium' | null;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const hasSettings = Boolean(children);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setExpanded(false);
    }
  }, [enabled]);

  const showSettingsPanel = enabled && hasSettings && expanded;
  const showExpandControl = enabled && hasSettings;

  return (
    <article
      className={classNames(
        'flex flex-col rounded-xl border transition-all duration-200 overflow-hidden',
        enabled
          ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10'
          : 'border-border bg-muted/10',
      )}
    >
      <div className="flex gap-3 p-4 sm:gap-4 sm:p-6">
        <div
          className={classNames(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-12 sm:w-12',
            enabled
              ? iconClassName ?? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-muted text-muted-foreground border border-border',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h4 className="text-base font-semibold text-foreground leading-snug">{title}</h4>
                <span
                  className={classNames(
                    'text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                    enabled
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {enabled ? 'Be' : 'Ki'}
                </span>
                {tierBadge ? <TierBadge tier={tierBadge} /> : null}
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-prose">{description}</p>
              {!enabled && (
                <p className="text-xs text-muted-foreground/80 mt-2 italic">
                  Ki van kapcsolva — nem jelenik meg a menüben és a kapcsolódó beállítások rejtve maradnak.
                </p>
              )}
              {enabled && hasSettings && !expanded && (
                <p className="text-xs text-muted-foreground mt-2">
                  A modul beállításai összecsukva — nyisd ki alul, ha szerkeszteni szeretnéd.
                </p>
              )}
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              aria-label={`${title} ${enabled ? 'kikapcsolása' : 'bekapcsolása'}`}
              className="shrink-0 mt-0.5"
            />
          </div>
        </div>
      </div>

      {showSettingsPanel ? (
        <div className="border-t border-border bg-muted/20 px-5 pb-4 pt-4 sm:px-6 space-y-4">{children}</div>
      ) : null}

      {showExpandControl || footer ? (
        <div
          className={classNames(
            'border-t border-border bg-muted/10 px-5 py-4 sm:px-6 flex flex-col gap-3',
            showSettingsPanel && 'pt-3',
          )}
        >
          {showExpandControl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center gap-1.5"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  <ChevronUp size={14} />
                  Beállítások összecsukása
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Beállítások megnyitása
                </>
              )}
            </Button>
          ) : null}
          {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
        </div>
      ) : null}
    </article>
  );
}
