import type { PlatformId } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'

interface PlatformBadgeProps {
  platformId: PlatformId | string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  variant?: 'pill' | 'dot' | 'icon'
}

export function PlatformBadge({
  platformId,
  size = 'md',
  showName = true,
  variant = 'pill',
}: PlatformBadgeProps) {
  const platform = PLATFORMS[platformId]
  if (!platform) return null

  const sizeMap = {
    sm: { pill: 'text-[10px] px-1.5 py-0.5', dot: 'w-4 h-4 text-[8px]', icon: 'w-5 h-5 text-[9px]' },
    md: { pill: 'text-xs px-2 py-1',          dot: 'w-5 h-5 text-[9px]', icon: 'w-7 h-7 text-[11px]' },
    lg: { pill: 'text-sm px-3 py-1.5',        dot: 'w-6 h-6 text-xs',   icon: 'w-9 h-9 text-sm' },
  }

  if (variant === 'dot') {
    return (
      <div
        className={`${sizeMap[size].dot} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
        style={{ background: platformId === 'tiktok' ? '#1a1a1a' : platform.color }}
        title={platform.name}
      >
        {platform.shortName[0]}
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <div
        className={`${sizeMap[size].icon} rounded-xl flex items-center justify-center font-bold text-white shrink-0`}
        style={{ background: platformId === 'tiktok' ? '#1a1a1a' : platform.color }}
        title={platform.name}
      >
        {platform.shortName.slice(0, 2)}
      </div>
    )
  }

  // pill variant
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full text-white ${sizeMap[size].pill}`}
      style={{ background: platformId === 'tiktok' ? '#1a1a1a' : platform.color }}
    >
      <span className="font-bold">{platform.shortName[0]}</span>
      {showName && <span>{platform.name}</span>}
    </span>
  )
}
