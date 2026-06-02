'use client';

import classNames from 'classnames';
import { Trash2 } from 'lucide-react';

export function CategoryTag({
  name,
  color,
  onDelete,
}: {
  name: string;
  color?: string;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-border bg-gradient-to-br from-card to-muted/20 px-3 py-2.5 text-sm shadow-sm hover:border-primary/25 hover:shadow-md transition-all">
      <span
        className={classNames(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold',
          !color && 'bg-primary/10 text-primary',
        )}
        style={color ? { backgroundColor: `${color}22`, color } : undefined}
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="flex-1 truncate font-medium text-foreground">{name}</span>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        aria-label={`${name} törlése`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
