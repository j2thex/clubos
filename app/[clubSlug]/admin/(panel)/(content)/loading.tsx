import { SkeletonHeader, SkeletonTabs, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonTabs count={4} />
      <SkeletonHeader />
      <SkeletonTable rows={6} />
    </div>
  );
}
