'use client';

import type { LucideIcon } from 'lucide-react';
import classNames from 'classnames';

export function SettingsBlock({
  title,
  description,
  icon: Icon,
  toneClassName,
  children,
  footer,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  toneClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <header className="flex items-start gap-3 border-b border-border bg-gradient-to-r from-muted/30 to-transparent px-5 py-4">
        <div
          className={classNames(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
            toneClassName,
          )}
        >
          <Icon size={17} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>}
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
      {footer ? (
        <div className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6 flex flex-wrap justify-end gap-2">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
