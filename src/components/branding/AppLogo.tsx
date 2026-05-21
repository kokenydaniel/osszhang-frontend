import { Command } from 'lucide-react';
import { APP_NAME } from '@/lib/branding';
import { cn } from '@/lib/utils';

const sizes = {
  sm: { box: 'h-8 w-8 rounded-md', icon: 15, text: 'text-sm' },
  md: { box: 'h-9 w-9 rounded-md', icon: 18, text: 'text-base' },
  lg: { box: 'h-11 w-11 rounded-lg', icon: 20, text: 'text-lg' },
} as const;

interface AppLogoProps {
  size?: keyof typeof sizes;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
}

export function AppLogo({
  size = 'md',
  showName = true,
  className,
  nameClassName,
}: AppLogoProps) {
  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center bg-gradient-to-br from-primary to-violet-500 shadow-glow',
          s.box,
        )}
      >
        <Command size={s.icon} className="text-primary-foreground" strokeWidth={2.5} />
      </div>
      {showName ? (
        <span className={cn('font-semibold tracking-tight text-foreground', s.text, nameClassName)}>
          {APP_NAME}
        </span>
      ) : null}
    </div>
  );
}
