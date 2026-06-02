'use client';

import { Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import classNames from 'classnames';
import { useAuthStore } from '@/stores/useAuthStore';
import type { SystemAnnouncementType } from '@/types/admin';

const toneStyles: Record<
  SystemAnnouncementType,
  { container: string; icon: string; text: string; badge: string }
> = {
  info: {
    container:
      'border-sky-400/80 bg-sky-100 text-sky-950 shadow-sm dark:border-sky-500/50 dark:bg-sky-950/70 dark:text-sky-50',
    icon: 'text-sky-800 dark:text-sky-200',
    text: 'text-sky-950 dark:text-sky-50',
    badge: 'bg-sky-200/80 text-sky-900 dark:bg-sky-800/60 dark:text-sky-100',
  },
  warning: {
    container:
      'border-amber-400/80 bg-amber-100 text-amber-950 shadow-sm dark:border-amber-500/50 dark:bg-amber-950/70 dark:text-amber-50',
    icon: 'text-amber-800 dark:text-amber-200',
    text: 'text-amber-950 dark:text-amber-50',
    badge: 'bg-amber-200/80 text-amber-900 dark:bg-amber-800/60 dark:text-amber-100',
  },
  danger: {
    container:
      'border-rose-400/80 bg-rose-100 text-rose-950 shadow-sm dark:border-rose-500/50 dark:bg-rose-950/70 dark:text-rose-50',
    icon: 'text-rose-800 dark:text-rose-200',
    text: 'text-rose-950 dark:text-rose-50',
    badge: 'bg-rose-200/80 text-rose-900 dark:bg-rose-800/60 dark:text-rose-100',
  },
};

const toneIcons = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertOctagon,
} as const;

const toneLabels: Record<SystemAnnouncementType, string> = {
  info: 'Rendszerüzenet',
  warning: 'Figyelmeztetés',
  danger: 'Sürgős üzenet',
};

export function SystemAnnouncementBanner() {
  const announcement = useAuthStore((state) => state.user?.system_announcement);

  return (
    <AnimatePresence initial={false}>
      {announcement ? (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={classNames('w-full border-b px-4 py-3 md:px-6', toneStyles[announcement.type].container)}
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-[1500px] items-start gap-3">
            {(() => {
              const Icon = toneIcons[announcement.type];
              return (
                <div
                  className={classNames(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    toneStyles[announcement.type].badge,
                  )}
                >
                  <Icon size={18} className={toneStyles[announcement.type].icon} />
                </div>
              );
            })()}
            <div className="min-w-0 flex-1 space-y-1">
              <p className={classNames('text-xs font-bold uppercase tracking-wide', toneStyles[announcement.type].icon)}>
                {toneLabels[announcement.type]}
              </p>
              <p className={classNames('text-sm leading-relaxed font-semibold md:text-base', toneStyles[announcement.type].text)}>
                {announcement.message}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
