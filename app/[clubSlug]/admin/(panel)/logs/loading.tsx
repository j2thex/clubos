import { SkeletonHeader, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      <SkeletonTable rows={10} />
    </div>
  );
}
