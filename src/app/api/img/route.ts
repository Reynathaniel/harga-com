import { NextRequest, NextResponse } from 'next/server'

// Image proxy for OLX CDN (apollo.olx.co.id requires Referer header)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  // Only proxy OLX images (security: don't proxy arbitrary URLs)
  if (!url.includes('olx.co.id') && !url.includes('apollo.olx')) {
    return NextResponse.redirect(url)
  }

  try {
    const res = await fetch(url, {
      headers: {
        Referer: 'https://www.olx.co.id/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return new NextResponse('Image fetch failed', { status: 502 })

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buf = await res.arrayBuffer()

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // cache 1 year on CDN
        'Content-Length': String(buf.byteLength),
      },
    })
  } catch {
    return new NextResponse('Proxy error', { status: 502 })
  }
}
