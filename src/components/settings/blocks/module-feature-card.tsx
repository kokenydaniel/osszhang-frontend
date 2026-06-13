'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, FlaskConical, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/subscription/TierBadge';
import classNames from 'classnames';

function softComingSoonIconClass(iconClassName?: string): string {
  const base = 'border shadow-sm';
  if (!iconClassName) {
    return `${base} bg-sky-100 text-sky-700 border-sky-200/90`;
  }
  if (iconClassName.includes('emerald')) {
    return `${base} bg-emerald-100 text-emerald-700 border-emerald-200/90`;
  }
  if (iconClassName.includes('violet')) {
    return `${base} bg-violet-100 text-violet-700 border-violet-200/90`;
  }
  if (iconClassName.includes('rose')) {
    return `${base} bg-rose-100 text-rose-700 border-rose-200/90`;
  }
  if (iconClassName.includes('sky')) {
    return `${base} bg-sky-100 text-sky-700 border-sky-200/90`;
  }
  if (iconClassName.includes('amber')) {
    return `${base} bg-amber-100 text-amber-800 border-amber-200/90`;
  }
  if (iconClassName.includes('teal')) {
    return `${base} bg-teal-100 text-teal-700 border-teal-200/90`;
  }
  return `${base} bg-sky-100 text-sky-700 border-sky-200/90`;
}

function ModuleComingSoonCard({
  title,
  description,
  icon,
  iconClassName,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClassName?: string;
}) {
  return (
    <article className="group relative isolate flex flex-col overflow-hidden rounded-2xl border border-sky-200/90 bg-white shadow-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/90 via-white to-white"
      />

      <div className="relative z-[1] p-5 sm:p-6">
        <div className="flex gap-4 sm:gap-5">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className={classNames(
              'flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-2xl [&_svg]:h-[1.35rem] [&_svg]:w-[1.35rem] [&_svg]:shrink-0',
              softComingSoonIconClass(iconClassName),
            )}
          >
            {icon}
          </motion.div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <h4 className="text-base font-semibold tracking-tight text-slate-900">{title}</h4>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-sky-800">
                <Clock size={11} strokeWidth={2.5} />
                Hamarosan
              </span>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{description}</p>
            <p className="mt-3 text-sm font-medium text-slate-800">
              Dolgozunk rajta — hamarosan elérhető lesz.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-[1] border-t border-sky-100 bg-sky-50/70 px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sky-200/80 bg-white text-sky-600 shadow-sm">
            <Sparkles size={13} strokeWidth={2.3} />
          </div>
          <p className="text-xs font-medium text-slate-700 sm:text-sm">
            Új modul — értesítünk, amint használható
          </p>
        </div>
      </div>
    </article>
  );
}

export function ModuleFeatureCard({
  title,
  description,
  enabled,
  onToggle,
  icon,
  iconClassName,
  tierBadge,
  comingSoon = false,
  platformPreview = false,
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
  comingSoon?: boolean;
  platformPreview?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const hasSettings = Boolean(children);
  const [expanded, setExpanded] = useState(false);
  const canConfigure = enabled && hasSettings && !comingSoon;

  useEffect(() => {
    if (!enabled) {
      setExpanded(false);
    }
  }, [enabled]);

  const showSettingsPanel = canConfigure && expanded;
  const showExpandControl = canConfigure;

  if (comingSoon) {
    return (
      <ModuleComingSoonCard
        title={title}
        description={description}
        icon={icon}
        iconClassName={iconClassName}
      />
    );
  }

  return (
    <article
      className={classNames(
        'flex flex-col rounded-xl border transition-all duration-200 overflow-hidden',
        enabled
          ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10'
          : 'border-border bg-muted/10',
        platformPreview && 'ring-2 ring-amber-500/45 border-amber-600/50 bg-amber-500/[0.04] dark:ring-amber-400/50 dark:border-amber-400/45',
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
                {platformPreview ? (
                  <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-700/55 bg-amber-500 text-amber-950 shadow-sm dark:border-amber-300/55 dark:bg-amber-400 dark:text-amber-950">
                    <FlaskConical size={10} strokeWidth={2.5} />
                    Fejlesztés alatt
                  </span>
                ) : null}
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
