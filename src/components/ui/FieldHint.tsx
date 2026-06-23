'use client';

import classNames from 'classnames';

export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p
      className={classNames(
        'text-[0.72rem] leading-snug',
        className ?? 'text-muted-foreground',
      )}
    >
      {children}
    </p>
  );
}
