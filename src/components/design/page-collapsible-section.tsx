'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import classNames from 'classnames';

export function PageCollapsibleSection({
  title,
  description,
  badge,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={classNames('rounded-xl border border-border bg-card shadow-sm overflow-hidden', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/25 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {badge ? (
              <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          ) : null}
        </div>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? <div className="border-t border-border px-4 py-3 space-y-3">{children}</div> : null}
    </section>
  );
}
