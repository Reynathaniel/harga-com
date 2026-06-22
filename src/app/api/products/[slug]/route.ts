/**
 * GET /api/products/[slug]
 * Returns full product detail including all offers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/db/products'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  if (!slug) {
    return NextResponse.json({ success: false, error: 'slug diperlukan' }, { status: 400 })
  }

  try {
    const product = await getProductBySlug(slug)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: product })
  } catch (err) {
    console.error('[GET /api/products/:slug]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data produk' },
      { status: 500 }
    )
  }
}
