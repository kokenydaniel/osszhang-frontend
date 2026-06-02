'use client';

import classNames from 'classnames';
import { motion } from 'motion/react';
import { Slash } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({ breadcrumbs, title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={classNames('relative flex flex-col gap-3 pb-5 mb-1 border-b border-border', className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-2 -left-2 h-16 w-16 rounded-full bg-primary/8 blur-2xl"
      />
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="relative flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {i > 0 && <Slash size={11} className="text-border" />}
              {b.href ? (
                <a href={b.href} className="hover:text-foreground transition-colors">{b.label}</a>
              ) : (
                <span className={i === breadcrumbs.length - 1 ? 'font-medium text-foreground' : ''}>{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.875rem] leading-[1.1] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <div className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</div>
          )}
        </div>
        {(actions || meta) && (
          <div className="flex flex-col gap-2 w-full min-w-0 sm:w-auto sm:max-w-[min(100%,420px)] sm:items-end shrink-0">
            {meta}
            {actions && (
              <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2">{actions}</div>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}
