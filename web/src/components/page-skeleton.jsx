import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 8 }) {
  return (
    <div className="space-y-2 rounded-4xl bg-card p-4 shadow-md ring-1 ring-foreground/5">
      <Skeleton className="h-9 w-full rounded-2xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-4xl" />
      ))}
    </div>
  );
}
