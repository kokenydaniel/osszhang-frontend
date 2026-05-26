'use client';

import { Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import classNames from 'classnames';
import { useAuthStore } from '@/stores/useAuthStore';
import type { SystemAnnouncementType } from '@/types/admin';

const toneStyles: Record<
  SystemAnnouncementType,
  { container: string; icon: string; text: string }
> = {
  info: {
    container: 'border-sky-300/60 bg-sky-50 text-sky-950 dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-50',
    icon: 'text-sky-700 dark:text-sky-300',
    text: 'text-sky-950 dark:text-sky-50',
  },
  warning: {
    container:
      'border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-50',
    icon: 'text-amber-700 dark:text-amber-300',
    text: 'text-amber-950 dark:text-amber-50',
  },
  danger: {
    container:
      'border-rose-300/70 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-50',
    icon: 'text-rose-700 dark:text-rose-300',
    text: 'text-rose-950 dark:text-rose-50',
  },
};

const toneIcons = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertOctagon,
} as const;

export function SystemAnnouncementBanner() {
  const announcement = useAuthStore((state) => state.user?.systemAnnouncement);

  return (
    <AnimatePresence initial={false}>
      {announcement ? (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={classNames(
            'w-full border-b px-4 py-2.5 md:px-6',
            toneStyles[announcement.type].container,
          )}
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-[1500px] items-start gap-3">
            {(() => {
              const Icon = toneIcons[announcement.type];
              return <Icon size={16} className={classNames('mt-0.5 shrink-0', toneStyles[announcement.type].icon)} />;
            })()}
            <p className={classNames('text-sm leading-relaxed font-medium', toneStyles[announcement.type].text)}>
              {announcement.message}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
