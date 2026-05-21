'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Star, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingModuleId } from '@/lib/householdOnboarding';
import { ONBOARDING_MODULE_OPTIONS } from '@/lib/householdOnboarding';

type Props = {
  householdName: string;
  categories: string[];
  personalizedCategories: string[];
  suggestedModules: OnboardingModuleId[];
  answeredCount: number;
  totalQuestions: number;
  className?: string;
};

export function OnboardingLivePreview({
  householdName,
  categories,
  personalizedCategories,
  suggestedModules,
  answeredCount,
  totalQuestions,
  className,
}: Props) {
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const moduleLabels = ONBOARDING_MODULE_OPTIONS.filter((m) => suggestedModules.includes(m.id));

  return (
    <div
      className={cn(
        'rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card p-4 space-y-3',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">Épül a háztartás</p>
            <p className="text-xs font-semibold text-foreground truncate">
              {householdName.trim() || 'A ti nevetek…'}
            </p>
          </div>
        </div>
        <span className="text-[0.65rem] font-bold tabular-nums text-primary shrink-0">{progress}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          <Tag size={11} />
          Kategóriák
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
          <AnimatePresence mode="popLayout">
            {categories.length === 0 ? (
              <motion.span
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[0.65rem] text-muted-foreground italic"
              >
                Válaszolj — itt megjelennek a címkék…
              </motion.span>
            ) : (
              categories.map((cat) => {
                const isPersonalized = personalizedCategories.some(
                  (c) => c.toLowerCase() === cat.toLowerCase(),
                );
                return (
                  <motion.span
                    key={cat}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.65rem] font-medium',
                      isPersonalized
                        ? 'border-primary/40 bg-primary/15 text-primary shadow-sm shadow-primary/10'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {isPersonalized && <Sparkles size={10} className="shrink-0" />}
                    {cat}
                  </motion.span>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {moduleLabels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Ajánlott modulok
            </p>
            <div className="flex flex-wrap gap-1.5">
              {moduleLabels.map((mod) => (
                <motion.span
                  key={mod.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700 dark:text-amber-400"
                >
                  <Star size={10} className="shrink-0 fill-current" />
                  {mod.label}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
