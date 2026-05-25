'use client';

import { SkeletonBlock, SkeletonCard, SkeletonMetricStrip } from '@/components/design/skeleton-primitives';

function SavingsGoalCardSkeleton() {
  return (
    <SkeletonCard className="!rounded-2xl">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-5 w-40 rounded-full" />
          </div>
          <SkeletonBlock className="h-6 w-14" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <SkeletonBlock className="h-5 w-16" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
          <SkeletonBlock className="h-3 w-full rounded-full" />
        </div>
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <SkeletonBlock className="h-6 w-24" />
          <SkeletonBlock className="h-7 w-24 rounded-md" />
        </div>
      </div>
    </SkeletonCard>
  );
}

function SavingsAccountCardSkeleton() {
  return (
    <SkeletonCard className="!rounded-2xl">
      <div className="p-5 flex flex-col gap-3">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="h-8 w-28" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    </SkeletonCard>
  );
}

export function SavingsPageSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-in fade-in duration-200">
      <SkeletonMetricStrip count={4} />

      <div className="flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(2)].map((_, i) => (
            <SavingsAccountCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SavingsGoalCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard className="!rounded-2xl h-36" />
        </div>
      </div>
    </div>
  );
}
