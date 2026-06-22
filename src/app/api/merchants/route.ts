/**
 * GET /api/merchants
 *
 * Returns all active merchants, ordered by cashback % descending.
 * Falls back to PLATFORMS config if Supabase unavailable.
 */

import { NextResponse } from 'next/server'
import { getMerchants } from '@/lib/db/offers'

export async function GET() {
  try {
    const merchants = await getMerchants()

    return NextResponse.json({ success: true, data: merchants })
  } catch (err) {
    console.error('[GET /api/merchants]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data merchant' },
      { status: 500 }
    )
  }
}
