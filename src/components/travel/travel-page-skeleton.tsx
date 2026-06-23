import { SkeletonBlock, SkeletonCard, SkeletonTableSection } from '@/components/design/skeleton-primitives';

export function TravelPageSkeleton() {
  return (
    <div className="flex flex-col gap-7 animate-in fade-in duration-200">
      <SkeletonTableSection rows={2} />

      <SkeletonCard className="!rounded-2xl">
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-full max-w-md" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className={index < 2 ? 'md:col-span-2 space-y-2' : 'space-y-2'}>
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>

          <SkeletonBlock className="h-10 w-56 rounded-md" />
        </div>
      </SkeletonCard>
    </div>
  );
}
