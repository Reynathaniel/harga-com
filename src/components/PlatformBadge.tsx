import Image from 'next/image'
import type { PlatformId } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'

interface PlatformBadgeProps {
  platformId: PlatformId | string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  variant?: 'pill' | 'dot' | 'icon'
}

const sizeMap = {
  sm: { pill: 'text-[10px] px-1.5 py-0.5 gap-1',  dot: 'w-5 h-5',  icon: 'w-6 h-6',  img: 14 },
  md: { pill: 'text-xs px-2 py-1 gap-1.5',          dot: 'w-6 h-6',  icon: 'w-8 h-8',  img: 18 },
  lg: { pill: 'text-sm px-3 py-1.5 gap-2',          dot: 'w-8 h-8',  icon: 'w-11 h-11', img: 24 },
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
  const logoSrc = `/logos/${platformId}.svg`

  const Logo = ({ s }: { s: number }) => (
    <Image
      src={logoSrc}
      alt={platform.name}
      width={s}
      height={s}
      className="rounded-sm object-contain"
      unoptimized
    />
  )

  if (variant === 'dot') {
    return (
      <div
        className={`${sz.dot} rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}
        style={{ background: bg }}
        title={platform.name}
      >
        <Logo s={sz.img} />
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <div
        className={`${sz.icon} rounded-xl flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}
        style={{ background: bg }}
        title={platform.name}
      >
        <Logo s={sz.img} />
      </div>
    )
  }

  // pill variant
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full text-white ${sz.pill}`}
      style={{ background: bg }}
    >
      <span className="flex-shrink-0 overflow-hidden rounded-sm">
        <Logo s={sz.img} />
      </span>
      {showName && <span>{platform.name}</span>}
    </span>
  )
}
