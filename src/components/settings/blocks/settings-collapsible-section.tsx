'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import classNames from 'classnames';

export function SettingsCollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={classNames('rounded-xl border border-border bg-card/60 overflow-hidden', className)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <h5 className="text-sm font-semibold text-foreground">{title}</h5>
          {description ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          ) : null}
        </div>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-muted-foreground mt-0.5" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground mt-0.5" />
        )}
      </button>
      {open ? <div className="border-t border-border px-4 py-4 space-y-4">{children}</div> : null}
    </section>
  );
}
