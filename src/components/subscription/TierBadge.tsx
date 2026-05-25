import classNames from 'classnames';
import { Star, Sparkles } from 'lucide-react';
import type { SubscriptionTier } from '@/types';

interface TierBadgeProps {
  tier: 'pro' | 'premium';
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const isPremium = tier === 'premium';

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider whitespace-nowrap',
        isPremium
          ? 'border-violet-500/35 bg-violet-500/12 text-violet-700 dark:text-violet-300'
          : 'border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-400',
        className,
      )}
    >
      {isPremium ? <Star size={9} className="fill-current" /> : <Sparkles size={9} />}
      {isPremium ? 'Premium' : 'Pro'}
    </span>
  );
}

export function tierBadgeForModule(moduleId: string): SubscriptionTier | null {
  if (moduleId === 'business') return 'premium';
  if (['savings', 'debts', 'utilities', 'meters'].includes(moduleId)) return 'pro';
  return null;
}
