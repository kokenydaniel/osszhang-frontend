'use client';

import { useEffect, useState } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AsyncStepProgressStep = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
};

export type AsyncStepProgressProps = {
  steps: AsyncStepProgressStep[];
  running: boolean;
  stepIntervalMs?: number;
  completeStepMs?: number;
  holdBeforeHideMs?: number;
  onComplete?: () => void;
  title?: string;
  className?: string;
};

type StepVisualState = 'pending' | 'active' | 'complete';

function resolveStepState(
  index: number,
  completedCount: number,
  stepsLength: number,
  phase: 'running' | 'finishing' | 'done',
): StepVisualState {
  if (phase === 'done' || index < completedCount) {
    return 'complete';
  }

  if (index === completedCount && completedCount < stepsLength) {
    return 'active';
  }

  return 'pending';
}

export function AsyncStepProgress({
  steps,
  running,
  stepIntervalMs = 2200,
  completeStepMs = 380,
  holdBeforeHideMs = 700,
  onComplete,
  title = 'Folyamatban…',
  className,
}: AsyncStepProgressProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [phase, setPhase] = useState<'running' | 'finishing' | 'done'>('running');

  useEffect(() => {
    if (!running) return;

    setPhase('running');
    setCompletedCount(0);
  }, [running, steps]);

  useEffect(() => {
    if (phase !== 'running' || !running) return;

    const timer = window.setInterval(() => {
      setCompletedCount((current) => Math.min(current + 1, Math.max(0, steps.length - 1)));
    }, stepIntervalMs);

    return () => window.clearInterval(timer);
  }, [phase, running, stepIntervalMs, steps.length]);

  useEffect(() => {
    if (running || phase !== 'running') return;

    setPhase('finishing');
  }, [running, phase]);

  useEffect(() => {
    if (phase !== 'finishing') return;

    const timer = window.setInterval(() => {
      setCompletedCount((current) => {
        const next = current + 1;
        if (next >= steps.length) {
          window.clearInterval(timer);
          setPhase('done');
          return steps.length;
        }

        return next;
      });
    }, completeStepMs);

    return () => window.clearInterval(timer);
  }, [phase, completeStepMs, steps.length]);

  useEffect(() => {
    if (phase !== 'done') return;

    const timer = window.setTimeout(() => onComplete?.(), holdBeforeHideMs);
    return () => window.clearTimeout(timer);
  }, [phase, holdBeforeHideMs, onComplete]);

  if (steps.length === 0) return null;

  const finished = phase === 'done';
  const activeStep = steps[Math.min(completedCount, steps.length - 1)];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={classNames(
        'rounded-xl border border-primary/20 bg-card shadow-sm overflow-hidden',
        'bg-gradient-to-br from-primary/5 via-card to-violet-500/5',
        className,
      )}
      aria-live="polite"
      aria-busy={!finished}
    >
      <div className="border-b border-border/70 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {finished ? 'Kész!' : title}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={activeStep?.id ?? 'done'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-muted-foreground mt-0.5"
              >
                {finished ? 'Az utazási terv elkészült.' : activeStep?.label}
              </motion.p>
            </AnimatePresence>
          </div>
          {!finished ? (
            <Loader2 size={18} className="shrink-0 animate-spin text-primary" aria-hidden />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <Check size={16} aria-hidden />
            </span>
          )}
        </div>
      </div>

      <ol className="px-4 py-3 space-y-0">
        {steps.map((step, index) => {
          const state = resolveStepState(index, completedCount, steps.length, phase);
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3">
              {!isLast ? (
                <span
                  className={classNames(
                    'absolute left-[15px] top-8 bottom-0 w-px',
                    state === 'complete' ? 'bg-emerald-500/50' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}

              <div
                className={classNames(
                  'relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                  state === 'complete' && 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600',
                  state === 'active' && 'border-primary/40 bg-primary/10 text-primary shadow-sm',
                  state === 'pending' && 'border-border bg-muted/40 text-muted-foreground',
                )}
              >
                {state === 'complete' ? (
                  <Check size={14} aria-hidden />
                ) : state === 'active' ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Icon size={14} aria-hidden />
                )}
              </div>

              <div className={classNames('min-w-0 flex-1 pb-4', isLast && 'pb-1')}>
                <p
                  className={classNames(
                    'text-sm font-medium leading-snug',
                    state === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                    state === 'active' && 'text-primary',
                  )}
                >
                  {step.label}
                </p>
                {step.description ? (
                  <p
                    className={classNames(
                      'mt-0.5 text-xs leading-relaxed',
                      state === 'active' ? 'text-muted-foreground' : 'text-muted-foreground/80',
                    )}
                  >
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </motion.section>
  );
}
