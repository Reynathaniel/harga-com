/**
 * POST /api/alerts — Create a price alert
 *
 * Body: { productId, targetPrice, email?, platforms? }
 * Stores to Supabase `watchlist` table.
 * Returns the created alert record.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { getProductById } from '@/lib/db/products'

interface AlertBody {
  productId:   string
  targetPrice: number
  email?:      string
  platforms?:  string[]
}

export async function POST(request: NextRequest) {
  let body: Partial<AlertBody>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { productId, targetPrice, email, platforms } = body

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'productId diperlukan' },
      { status: 400 }
    )
  }
  if (targetPrice == null || typeof targetPrice !== 'number' || targetPrice <= 0) {
    return NextResponse.json(
      { success: false, error: 'targetPrice harus berupa angka positif' },
      { status: 400 }
    )
  }

  try {
    // Verify product exists
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: `Produk "${productId}" tidak ditemukan` },
        { status: 404 }
      )
    }

    const db = tryGetServerClient()

    if (db) {
      // Use a static "guest" user id when no auth — real auth integration later
      // For now we store email in session_id column as a workaround
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db as any)
        .from('watchlist')
        .insert({
          user_id:      email ?? 'guest',
          product_id:   product.id,
          target_price: targetPrice,
        })
        .select()
        .single()

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data as any
      return NextResponse.json({
        success: true,
        data: {
          id:           row.id,
          productId:    row.product_id,
          productName:  product.name,
          productImage: product.images[0] ?? null,
          targetPrice:  row.target_price,
          currentPrice: product.lowestPrice,
          platforms:    platforms ?? [],
          active:       true,
          createdAt:    row.created_at,
        },
      })
    }

    // Mock fallback — just echo back a synthetic record
    const mockAlert = {
      id:           `alert_${Date.now()}`,
      productId:    product.id,
      productName:  product.name,
      productImage: product.images[0] ?? null,
      targetPrice,
      currentPrice: product.lowestPrice,
      platforms:    platforms ?? [],
      active:       true,
      createdAt:    new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: mockAlert })
  } catch (err) {
    console.error('[POST /api/alerts]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat price alert' },
      { status: 500 }
    )
  }
}

// GET /api/alerts — placeholder (would need auth)
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Autentikasi diperlukan untuk melihat alerts' },
    { status: 401 }
  )
}
