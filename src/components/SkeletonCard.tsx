export function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-square skeleton" />

      {/* Content skeleton */}
      <div className="p-3 space-y-2.5">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-3/4 rounded" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </div>

        {/* Price */}
        <div className="skeleton h-5 w-28 rounded" />
        <div className="skeleton h-3 w-20 rounded" />

        {/* Cashback pill */}
        <div className="skeleton h-5 w-16 rounded-full" />

        {/* Platform dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton w-5 h-5 rounded-full" />
          ))}
        </div>

        {/* Button */}
        <div className="skeleton h-8 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
