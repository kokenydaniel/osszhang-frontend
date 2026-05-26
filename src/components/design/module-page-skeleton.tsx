import { SkeletonMetricStrip, SkeletonTableSection } from '@/components/design/skeleton-primitives';

interface ModulePageSkeletonProps {
  metrics?: number;
  tableRows?: number;
}

export function ModulePageSkeleton({ metrics = 4, tableRows = 5 }: ModulePageSkeletonProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <SkeletonMetricStrip count={metrics} />
      <SkeletonTableSection rows={tableRows} />
    </div>
  );
}
