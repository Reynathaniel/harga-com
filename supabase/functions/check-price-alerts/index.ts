// Supabase Edge Function: check-price-alerts
//
// Invoked on a schedule (see .github/workflows/check-price-alerts.yml).
// For every active price alert, checks whether any product in
// `products_with_best_offer` matches the alert's query and has dropped to
// or below the target price. On a match, records a row in
// `alert_notifications` (deduped per alert+product) and — if RESEND_API_KEY
// is configured — sends an email via Resend. WhatsApp sending is not wired
// up yet, so those notifications are recorded with sent = false.

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'alerts@harga.com'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://harga-com.vercel.app'

interface PriceAlert {
  id: string
  query: string | null
  email: string | null
  phone: string | null
  target_price: number
  notify_type: string | null
  is_active: boolean
}

interface MatchedProduct {
  id: string
  name: string
  slug: string
  best_price: number | null
}

function formatIDR(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

async function sendEmail(to: string, alert: PriceAlert, product: MatchedProduct): Promise<boolean> {
  if (!RESEND_API_KEY || !product.best_price) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        subject: `Turun harga: ${product.name} sekarang ${formatIDR(product.best_price)}`,
        html: `
          <p>Produk yang kamu pantau turun harga:</p>
          <p><strong>${product.name}</strong><br/>
          Sekarang: <strong>${formatIDR(product.best_price)}</strong><br/>
          Target kamu: ${formatIDR(alert.target_price)}</p>
          <p><a href="${SITE_URL}/produk/${product.slug}">Lihat produk di harga.com</a></p>
        `,
      }),
    })

    if (!res.ok) {
      console.error(`[check-price-alerts] Resend responded ${res.status}`, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[check-price-alerts] Resend send failed', err)
    return false
  }
}

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: alerts, error: alertsError } = await supabase
    .from('price_alerts')
    .select('id, query, email, phone, target_price, notify_type, is_active')
    .eq('is_active', true)
    .not('query', 'is', null)

  if (alertsError) {
    console.error('[check-price-alerts] failed to load alerts', alertsError)
    return new Response(JSON.stringify({ error: alertsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let checked = 0
  let triggered = 0

  for (const alert of (alerts ?? []) as PriceAlert[]) {
    checked++
    const query = (alert.query ?? '').trim()
    if (!query) continue

    const { data: matches, error: matchError } = await supabase
      .from('products_with_best_offer')
      .select('id, name, slug, best_price')
      .ilike('name', `%${query}%`)
      .not('best_price', 'is', null)
      .lte('best_price', alert.target_price)
      .order('best_price', { ascending: true })
      .limit(5)

    if (matchError) {
      console.error(`[check-price-alerts] match query failed for alert ${alert.id}`, matchError)
      continue
    }

    for (const product of (matches ?? []) as MatchedProduct[]) {
      const { data: existing } = await supabase
        .from('alert_notifications')
        .select('id')
        .eq('alert_id', alert.id)
        .eq('product_id', product.id)
        .maybeSingle()

      if (existing) continue // already notified for this alert + product combo

      const channel = alert.notify_type === 'whatsapp' ? 'whatsapp' : 'email'
      const sent = channel === 'email' && alert.email
        ? await sendEmail(alert.email, alert, product)
        : false // WhatsApp sending not implemented — recorded for later dispatch

      await supabase.from('alert_notifications').insert({
        alert_id: alert.id,
        product_id: product.id,
        channel,
        sent,
      })

      triggered++

      // One-time alert: deactivate once a match has been recorded.
      await supabase.from('price_alerts').update({ is_active: false }).eq('id', alert.id)
    }
  }

  return new Response(JSON.stringify({ checked, triggered }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
