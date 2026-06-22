'use client'

/**
 * MediaEmbed — zero-storage media component.
 *
 * Media files never leave their original CDN.
 * We only store URLs and embed/reference them here:
 *   - YouTube  → <iframe src="youtube.com/embed/…">
 *   - TikTok   → <iframe src="tiktok.com/embed/…">
 *   - Direct video (.mp4, Shopee CDN, etc.) → <video src="…">
 *   - No video  → <img src="…">
 *
 * Thumbnail with play-button overlay is shown first; player expands on click.
 */

import { useState } from 'react'

export interface MediaEmbedProps {
  videoUrl?: string
  videoThumb?: string
  imageUrl?: string
  title?: string
  className?: string
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return m ? m[1] : null
}

function getTikTokId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/)
  return m ? m[1] : null
}

export default function MediaEmbed({
  videoUrl,
  videoThumb,
  imageUrl,
  title = '',
  className = '',
}: MediaEmbedProps) {
  const [playing, setPlaying] = useState(false)
  const thumb = videoThumb || imageUrl || ''

  // No video → plain image
  if (!videoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl || ''}
        alt={title}
        className={className}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
      />
    )
  }

  // Playing state — render the appropriate embed
  if (playing) {
    const ytId = getYouTubeId(videoUrl)
    if (ytId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          className={className}
          style={{ width: '100%', height: '100%', border: 0 }}
          allowFullScreen
          allow="autoplay; encrypted-media"
          title={title}
        />
      )
    }

    const ttId = getTikTokId(videoUrl)
    if (videoUrl.includes('tiktok.com') && ttId) {
      return (
        <iframe
          src={`https://www.tiktok.com/embed/${ttId}`}
          className={className}
          style={{ width: '100%', height: '100%', border: 0 }}
          allowFullScreen
          title={title}
        />
      )
    }

    // Direct video (Shopee CDN, Lazada, etc.) — file stays on their CDN
    return (
      <video
        src={videoUrl}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        autoPlay
        controls
        playsInline
        poster={thumb}
      />
    )
  }

  // Thumbnail with play-button overlay
  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{ width: '100%', height: '100%' }}
      onClick={() => setPlaying(true)}
      title={`Play: ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Play overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Triangle play icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polygon points="5,3 15,9 5,15" fill="#1a1a1a" />
          </svg>
        </div>
      </div>
    </div>
  )
}
