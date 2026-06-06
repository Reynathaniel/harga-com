import { formatRupiah } from '@/lib/utils'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface PriceBadgeProps {
  price: number
  originalPrice?: number
  compact?: boolean
  showTrend?: 'up' | 'down' | 'flat'
  trendPct?: number
}

export function PriceBadge({
  price,
  originalPrice,
  compact = false,
  showTrend,
  trendPct,
}: PriceBadgeProps) {
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0

  return (
    <div className={`flex items-baseline gap-2 ${compact ? '' : 'flex-wrap'}`}>
      <span className={`font-bold text-white ${compact ? 'text-base' : 'text-xl'}`}>
        {formatRupiah(price, true)}
      </span>

      {originalPrice && discount > 0 && (
        <>
          <span className={`text-[var(--text-muted)] line-through ${compact ? 'text-xs' : 'text-sm'}`}>
            {formatRupiah(originalPrice, true)}
          </span>
          <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        </>
      )}

      {showTrend && trendPct !== undefined && (
        <span
          className={`flex items-center gap-0.5 text-xs font-medium ${
            showTrend === 'down' ? 'text-green-400' : showTrend === 'up' ? 'text-red-400' : 'text-[var(--text-muted)]'
          }`}
        >
          {showTrend === 'down' && <TrendingDown size={12} />}
          {showTrend === 'up' && <TrendingUp size={12} />}
          {showTrend === 'flat' && <Minus size={12} />}
          {showTrend !== 'flat' && `${trendPct}%`}
        </span>
      )}
    </div>
  )
}
