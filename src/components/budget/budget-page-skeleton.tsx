'use client';

import { SkeletonBlock, SkeletonCard, SkeletonMetricStrip, SkeletonTableSection } from '@/components/design/skeleton-primitives';

export function BudgetPageGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 animate-in fade-in duration-200">
      <SkeletonCard className="!rounded-2xl h-[280px]">
        <div className="p-5 flex flex-col gap-3 h-full">
          <SkeletonBlock className="h-4 w-28" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <SkeletonBlock className="h-3 flex-1" />
              <SkeletonBlock className="h-3 w-14" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <div className="flex flex-col gap-7">
        <SkeletonTableSection rows={3} />
        <SkeletonTableSection rows={5} />
      </div>
    </div>
  );
}

export function BudgetPageSkeleton() {
  return (
    <div className="flex flex-col gap-7 w-full animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <SkeletonCard className="!rounded-2xl">
          <div className="p-5 flex flex-col gap-4">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-9 w-full rounded-lg" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        </SkeletonCard>
        <SkeletonMetricStrip count={3} />
      </div>

      <SkeletonMetricStrip count={4} />

      <BudgetPageGridSkeleton />
    </div>
  );
}
