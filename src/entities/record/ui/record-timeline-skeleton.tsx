import { Skeleton } from "@/shared/ui/skeleton";

const SKELETON_ITEMS = ["first", "second", "third"] as const;

type RecordTimelineSkeletonProps = {
  label?: string;
};

export function RecordTimelineSkeleton({ label = "기록을 불러오는 중" }: RecordTimelineSkeletonProps) {
  return (
    <div aria-label={label} aria-live="polite" className="flex flex-col gap-4" role="status">
      <div className="flex items-center justify-between gap-3 px-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-8" />
      </div>
      {SKELETON_ITEMS.map((item, index) => (
        <div className="relative pl-5" key={item}>
          {index < SKELETON_ITEMS.length - 1 ? (
            <span className="absolute top-3.5 -bottom-7.5 left-1.75 w-px bg-border" aria-hidden="true" />
          ) : null}
          <Skeleton className="absolute top-1.5 left-0 z-10 size-3.75 rounded-full border-4 border-background" />
          <div className="rounded-lg px-1 py-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-2 h-5 w-3/4" />
            <Skeleton className="mt-2 h-3.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
