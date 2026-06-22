import { SkeletonGrid } from '@/components/SkeletonCard'

export default function CariLoading() {
  return (
    <div className="pt-[88px] min-h-screen">
      {/* Search header skeleton */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-12 w-full rounded-2xl" />
        </div>
      </div>

      {/* Category chips skeleton */}
      <div className="border-b border-[var(--border)] px-4 py-2">
        <div className="max-w-7xl mx-auto flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-20 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="skeleton h-96 w-full rounded-xl" />
          </div>
          {/* Grid skeleton */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton h-6 w-40 rounded" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-8 w-24 rounded-lg" />
                ))}
              </div>
            </div>
            <SkeletonGrid count={12} />
          </div>
        </div>
      </div>
    </div>
  )
}
