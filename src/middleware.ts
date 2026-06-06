/**
 * middleware.ts — Global middleware for harga.com API
 *
 * Features:
 * 1. CORS headers for all /api/* routes
 * 2. Basic in-memory rate limiting (60 req/min per IP)
 * 3. Request logging (method, path, duration)
 */

import { NextRequest, NextResponse } from 'next/server'

// ── Rate limiter ───────────────────────────────────────────────────
// Simple in-memory store; resets on cold start / edge redeployment.
// For production, replace with Redis or Upstash.

interface RateEntry {
  count:     number
  resetAt:   number
}

const rateStore = new Map<string, RateEntry>()

const RATE_LIMIT     = 60   // requests per window
const RATE_WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateStore.get(ip)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_WINDOW_MS
    rateStore.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt }
  }

  entry.count++
  const remaining = Math.max(0, RATE_LIMIT - entry.count)
  return { allowed: entry.count <= RATE_LIMIT, remaining, resetAt: entry.resetAt }
}

// ── CORS helpers ───────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age':       '86400',
}

// ── Middleware ─────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { method } = request
  const start = Date.now()

  // Only run on API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Preflight
  if (method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  }

  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rate = checkRateLimit(ip)

  if (!rate.allowed) {
    console.warn(`[rate-limit] ${ip} exceeded limit on ${pathname}`)
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak request. Coba lagi dalam 1 menit.' },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          'Retry-After':              String(Math.ceil((rate.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit':        String(RATE_LIMIT),
          'X-RateLimit-Remaining':    '0',
          'X-RateLimit-Reset':        String(Math.ceil(rate.resetAt / 1000)),
        },
      }
    )
  }

  const response = NextResponse.next()

  // Attach CORS + rate limit headers
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
  response.headers.set('X-RateLimit-Limit',     String(RATE_LIMIT))
  response.headers.set('X-RateLimit-Remaining', String(rate.remaining))
  response.headers.set('X-RateLimit-Reset',     String(Math.ceil(rate.resetAt / 1000)))

  // Request logging (fires asynchronously via waitUntil in production)
  const duration = Date.now() - start
  console.log(`[api] ${method} ${pathname} — ${duration}ms | ip=${ip} remaining=${rate.remaining}`)

  return response
}

export const config = {
  matcher: '/api/:path*',
}
