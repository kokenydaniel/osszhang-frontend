import classNames from 'classnames';

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={classNames('animate-pulse rounded-md bg-muted', className)} />;
}

export function SkeletonCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={classNames('rounded-2xl border border-border bg-card shadow-sm animate-pulse', className)}>
      {children ?? (
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      )}
    </div>
  );
}

export function SkeletonMetricStrip({ count = 4 }: { count?: number }) {
  return (
    <div className={classNames('grid gap-3', count === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4')}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} className="!rounded-xl">
          <div className="p-4 flex flex-col gap-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-6 w-28" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function SkeletonTableSection({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
      <div className="divide-y divide-border">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4">
            <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
            <SkeletonBlock className="h-4 flex-1 max-w-[180px]" />
            <SkeletonBlock className="h-4 w-20 hidden sm:block" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-7 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
