import { SkeletonHeader, SkeletonTabs, SkeletonCardGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      <SkeletonTabs count={5} />
      <SkeletonCardGrid count={8} cols={2} />
    </div>
  );
}
