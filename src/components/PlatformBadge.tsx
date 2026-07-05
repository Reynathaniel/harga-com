import type { PlatformId } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'

interface PlatformBadgeProps {
  platformId: PlatformId | string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  variant?: 'pill' | 'dot' | 'icon'
}

const sizeMap = {
  sm: { pill: 'text-[10px] px-1.5 py-0.5 gap-1', dot: 'w-5 h-5 text-[9px]',   icon: 'w-6 h-6 text-[9px]'   },
  md: { pill: 'text-xs px-2 py-1 gap-1.5',       dot: 'w-6 h-6 text-[10px]',  icon: 'w-8 h-8 text-[10px]'  },
  lg: { pill: 'text-sm px-3 py-1.5 gap-2',        dot: 'w-8 h-8 text-xs',      icon: 'w-11 h-11 text-xs'    },
}

export function PlatformBadge({
  platformId,
  size = 'md',
  showName = true,
  variant = 'pill',
}: PlatformBadgeProps) {
  const platform = PLATFORMS[platformId]
  if (!platform) return null

  const sz = sizeMap[size]
  const bg = platformId === 'tiktok' ? '#010101' : platform.color
  const initials = (platform.shortName || platform.name).slice(0, 2).toUpperCase()

  if (variant === 'dot') {
    return (
      <div
        className={`${sz.dot} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
        style={{ background: bg }}
        title={platform.name}
      >
        {initials}
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <div
        className={`${sz.icon} rounded-xl flex items-center justify-center font-bold text-white shrink-0`}
        style={{ background: bg }}
        title={platform.name}
      >
        {initials}
      </div>
    )
  }

  // pill variant (default)
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full text-white ${sz.pill}`}
      style={{ background: bg }}
    >
      <span
        className="flex-shrink-0 rounded-sm flex items-center justify-center font-bold leading-none"
        style={{ width: 14, height: 14, fontSize: 8, background: 'rgba(0,0,0,0.18)' }}
      >
        {initials}
      </span>
      {showName && <span>{platform.name}</span>}
    </span>
  )
}
