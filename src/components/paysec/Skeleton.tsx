import { cn } from "@/lib/utils";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-xl bg-secondary/60", className)} />
);

export const TableSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="card-elevated overflow-hidden">
    <div className="border-b border-hairline px-6 py-4">
      <Skeleton className="h-5 w-40" />
    </div>
    <div className="divide-y divide-hairline">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-5">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="card-elevated p-6 space-y-4">
    <div className="flex justify-between">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-3 w-32 mt-6" />
    <Skeleton className="h-8 w-24" />
  </div>
);
