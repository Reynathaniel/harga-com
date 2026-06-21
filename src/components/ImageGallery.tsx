'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface Props {
  images: string[]
  alt: string
}

export function ImageGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const [zoomed, setZoomed] = useState(false)

  const imgs = images.length > 0 ? images : [`https://picsum.photos/seed/${encodeURIComponent(alt)}/600/600`]

  const src = (i: number) =>
    failed[i]
      ? `https://picsum.photos/seed/${encodeURIComponent(alt + i)}/600/600`
      : imgs[i]

  const prev = () => setActive(i => (i - 1 + imgs.length) % imgs.length)
  const next = () => setActive(i => (i + 1) % imgs.length)

  const handleErr = (i: number) => setFailed(f => ({ ...f, [i]: true }))

  return (
    <>
      {/* Main image */}
      <div className="relative aspect-square bg-[var(--bg-hover)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] mb-3">
        <Image
          src={src(active)}
          alt={alt}
          fill
          className="object-contain p-6 transition-opacity duration-200"
          onError={() => handleErr(active)}
          priority
          unoptimized
        />

        {/* Zoom hint */}
        <button
          onClick={() => setZoomed(true)}
          className="absolute top-3 right-3 w-8 h-8 bg-[var(--bg-card)]/80 backdrop-blur-sm border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Perbesar"
        >
          <ZoomIn size={14} />
        </button>

        {/* Prev / Next */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--bg-card)]/80 backdrop-blur-sm border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--bg-card)]/80 backdrop-blur-sm border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronRight size={16} />
            </button>

            {/* Dot nav */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === active
                      ? 'bg-[var(--brand)] w-4'
                      : 'bg-[var(--text-muted)]/40 hover:bg-[var(--text-muted)]'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imgs.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? 'border-[var(--brand)] shadow-[0_0_0_3px_rgba(249,115,22,0.12)]'
                  : 'border-[var(--border-subtle)] opacity-50 hover:opacity-90 hover:border-[var(--border)]'
              }`}
            >
              <Image
                src={src(i)}
                alt=""
                fill
                className="object-contain p-1"
                onError={() => handleErr(i)}
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
        >
          <div className="relative w-[90vw] h-[90vw] max-w-xl max-h-xl">
            <Image
              src={src(active)}
              alt={alt}
              fill
              className="object-contain"
              onError={() => handleErr(active)}
              unoptimized
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light"
            onClick={() => setZoomed(false)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
