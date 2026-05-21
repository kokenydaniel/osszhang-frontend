import classNames from 'classnames';

type Status = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

interface StatusPillProps {
  status?: Status;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm';
}

const styles: Record<Status, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  info: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  primary: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  neutral: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export function StatusPill({ status = 'neutral', dot, children, className, size = 'sm' }: StatusPillProps) {
  const s = styles[status];
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-md font-medium',
        size === 'xs' ? 'px-1.5 py-0.5 text-[0.65rem]' : 'px-2 py-0.5 text-[0.7rem]',
        s.bg,
        s.text,
        className,
      )}
    >
      {dot && <span className={classNames('h-1.5 w-1.5 rounded-full', s.dot)} />}
      {children}
    </span>
  );
}
