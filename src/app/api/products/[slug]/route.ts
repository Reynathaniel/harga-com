export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/products/[slug]
 * Returns full product detail including all offers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/db/products'

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  if (!slug) {
    return NextResponse.json({ success: false, error: 'slug diperlukan' }, { status: 400, headers: NO_CACHE })
  }

  try {
    const product = await getProductBySlug(slug)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404, headers: NO_CACHE }
      )
    }

    return NextResponse.json({ success: true, data: product }, { headers: NO_CACHE })
  } catch (err) {
    console.error('[GET /api/products/:slug]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data produk' },
      { status: 500, headers: NO_CACHE }
    )
  }
}
