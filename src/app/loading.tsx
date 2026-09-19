import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton shape="panel" />
      <Skeleton shape="panel" />
    </div>
  );
}
