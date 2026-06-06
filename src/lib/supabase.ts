import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// ============================================================
// Config detection
// ============================================================

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const serviceRole  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/**
 * Returns true when Supabase env vars are properly configured.
 * Used to toggle between live DB and mock-data fallback.
 */
export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.startsWith('https://') &&
    supabaseAnon.length > 20
  )
}

// ============================================================
// Browser (client-side) client — anon key, respects RLS
// ============================================================

let _browserClient: ReturnType<typeof createClient<Database>> | null = null

export function getBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      '[harga.com] Supabase is not configured. ' +
      'Copy .env.local.example → .env.local and fill in your keys.'
    )
  }
  if (!_browserClient) {
    _browserClient = createClient<Database>(supabaseUrl, supabaseAnon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return _browserClient
}

// ============================================================
// Server (API routes / RSC) client — service role, bypasses RLS
// ============================================================

/**
 * Returns a fresh service-role client for each server request.
 * Never call this from the browser bundle.
 */
export function getServerClient() {
  if (!serviceRole) {
    throw new Error(
      '[harga.com] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Required for server-side operations.'
    )
  }
  return createClient<Database>(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// ============================================================
// Safe version — returns null instead of throwing
// Useful in RSC where we want graceful mock fallback
// ============================================================

export function tryGetServerClient() {
  try {
    return getServerClient()
  } catch {
    return null
  }
}

export function tryGetBrowserClient() {
  try {
    return getBrowserClient()
  } catch {
    return null
  }
}
