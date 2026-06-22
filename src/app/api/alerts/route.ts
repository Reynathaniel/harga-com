/**
 * POST /api/alerts — Create a price alert
 *
 * Accepts two modes:
 * 1. Product alert: { productId, targetPrice, email?, platforms? }
 * 2. Query alert:   { query, targetPrice, email, notifyType? }
 *
 * Stores to Supabase `price_alerts` or `watchlist` table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { getProductById } from '@/lib/db/products'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const db = tryGetServerClient()

  // --- Mode 1: query-based alert (from /alert page form) ---
  if (body.query && !body.productId) {
    const query       = String(body.query ?? '').trim()
    const email       = String(body.email ?? '').trim()
    const targetPrice = Number(body.targetPrice)
    const notifyType  = String(body.notifyType ?? 'email')

    if (!query || !email || !targetPrice || targetPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'query, email, dan targetPrice diperlukan' },
        { status: 400 }
      )
    }

    if (db) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (db as any)
          .from('price_alerts')
          .insert({ query, email, target_price: targetPrice, notify_type: notifyType })
          .select()
          .single()

        if (error) throw error

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ success: true, data: data as any })
      } catch (err) {
        console.error('[POST /api/alerts] DB error (query mode):', err)
        // fall through to mock success
      }
    }

    // Mock fallback
    return NextResponse.json({
      success: true,
      data: {
        id:          `alert_${Date.now()}`,
        query,
        email,
        targetPrice,
        notifyType,
        active:      true,
        createdAt:   new Date().toISOString(),
      },
    })
  }

  // --- Mode 2: product-based alert ---
  const { productId, targetPrice, email, platforms } = body as {
    productId:   string
    targetPrice: number
    email?:      string
    platforms?:  string[]
  }

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
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: `Produk "${productId}" tidak ditemukan` },
        { status: 404 }
      )
    }

    if (db) {
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

    // Mock fallback
    return NextResponse.json({
      success: true,
      data: {
        id:           `alert_${Date.now()}`,
        productId:    product.id,
        productName:  product.name,
        productImage: product.images[0] ?? null,
        targetPrice,
        currentPrice: product.lowestPrice,
        platforms:    platforms ?? [],
        active:       true,
        createdAt:    new Date().toISOString(),
      },
    })
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
