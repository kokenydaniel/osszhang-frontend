import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const tones = {
  primary: 'bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-inset ring-primary/15',
  neutral: 'bg-gradient-to-br from-muted to-muted/40 text-muted-foreground ring-1 ring-inset ring-border',
  success: 'bg-gradient-to-br from-emerald-100 to-emerald-50/60 text-emerald-700 ring-1 ring-inset ring-emerald-200/60',
  warning: 'bg-gradient-to-br from-amber-100 to-amber-50/60 text-amber-700 ring-1 ring-inset ring-amber-200/60',
  danger: 'bg-gradient-to-br from-rose-100 to-rose-50/60 text-rose-700 ring-1 ring-inset ring-rose-200/60',
  info: 'bg-gradient-to-br from-sky-100 to-sky-50/60 text-sky-700 ring-1 ring-inset ring-sky-200/60',
} as const;

export type IconPodTone = keyof typeof tones | 'teal' | 'coral' | 'mint' | 'sky' | 'amber' | 'violet' | 'slate';

const legacyMap: Record<string, IconPodTone> = {
  teal: 'primary',
  coral: 'danger',
  mint: 'success',
  sky: 'info',
  amber: 'warning',
  violet: 'primary',
  slate: 'neutral',
};

interface IconPodProps {
  icon: LucideIcon;
  tone?: IconPodTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  solid?: boolean;
}

const solidTones = {
  primary: 'bg-primary text-primary-foreground',
  neutral: 'bg-foreground text-background',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-rose-500 text-white',
  info: 'bg-sky-500 text-white',
} as const;

export function IconPod({ icon: Icon, tone = 'primary', size = 'md', className, solid = false }: IconPodProps) {
  const resolved = (tone in tones ? tone : legacyMap[tone] ?? 'primary') as keyof typeof tones;
  const sizeClass = {
    sm: 'h-7 w-7 rounded-md [&_svg]:size-3.5',
    md: 'h-9 w-9 rounded-lg [&_svg]:size-[18px]',
    lg: 'h-11 w-11 rounded-lg [&_svg]:size-5',
  }[size];

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 shadow-sm',
        sizeClass,
        solid ? solidTones[resolved] : tones[resolved],
        className,
      )}
    >
      <Icon strokeWidth={2} />
    </div>
  );
}
