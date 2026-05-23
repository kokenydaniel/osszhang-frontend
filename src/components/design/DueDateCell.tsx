'use client';

import classNames from 'classnames';
import { Calendar } from 'lucide-react';
import { formatDate, isPastDueDate } from '@/utils';

interface DueDateCellProps {
  date: string;
  today?: string;
  overdue?: boolean;
  settled?: boolean;
  className?: string;
}

export function DueDateCell({ date, today, overdue, settled, className }: DueDateCellProps) {
  const isOverdue =
    settled ? false : overdue ?? (today ? isPastDueDate(date, today) : false);

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 text-xs tabular-nums',
        isOverdue ? 'text-rose-600 font-medium' : 'text-muted-foreground',
        className,
      )}
    >
      <Calendar size={11} strokeWidth={2.2} />
      {formatDate(date)}
      {isOverdue ? <span className="text-[10px] uppercase tracking-wider">lejárt</span> : null}
    </span>
  );
}
