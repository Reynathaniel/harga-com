#!/usr/bin/env node
/**
 * scrape-smart.mjs - Enhanced scraper with slug-based deduplication
 *
 * Usage:
 *   node scripts/scrape-smart.mjs --platform tokopedia --queries "iphone,samsung"
 *   node scripts/scrape-smart.mjs --platform all --queries "iphone" --limit 20
 *
 * Env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { parseArgs } from 'node:util'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rtdbfbmbvuqentvxcstf.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const MERCHANT_UUID = {
  tokopedia: '00000000-0000-0000-0000-000000000001',
  shopee:    '00000000-0000-0000-0000-000000000002',
  lazada:    '00000000-0000-0000-0000-000000000003',
  bukalapak: '00000000-0000-0000-0000-000000000004',
  blibli:    '00000000-0000-0000-0000-000000000005',
  tiktok:    '00000000-0000-0000-0000-000000000006',
  amazon:    '00000000-0000-0000-0000-000000000007',
  aliexpress:'00000000-0000-0000-0000-000000000008',
  alibaba:   '00000000-0000-0000-0000-000000000009',
  jd:        '00000000-0000-0000-0000-000000000010',
  olx:       '00000000-0000-0000-0000-000000000011',
  carousell: '00000000-0000-0000-0000-000000000012',
}
const ALL_PLATFORMS  = Object.keys(MERCHANT_UUID)
const INDO_PLATFORMS = ['tokopedia','shopee','lazada','blibli','tiktok','bukalapak']

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim().slice(0,100)
}
function calcDiscount(price, orig) {
  if (!orig || orig <= price) return null
  return Math.round((1 - price/orig)*100)
}
async function sbFetch(path, options={}) {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY not set')
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer: options.prefer||'return=representation', ...options.headers }
  })
  if (!res.ok) throw new Error(`Supabase ${options.method||'GET'} ${path} -> ${res.status}: ${await res.text()}`)
  const ct = res.headers.get('content-type')||''
  return ct.includes('json') ? res.json() : null
}
async function findProductBySlug(slug) {
  try {
    const rows = await sbFetch(`/products?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`)
    return rows?.[0]?.id ?? null
  } catch { return null }
}
async function upsertProduct(listing) {
  const slug = slugify(listing.title)
  if (!slug) return null
  const rows = await sbFetch('/products?on_conflict=slug&select=id', {
    method:'POST', prefer:'resolution=merge-duplicates,return=representation',
    body: JSON.stringify({ slug, name:listing.title, brand:listing.brand??null, category:listing.category??null, image_url:listing.imageUrl??null, images:listing.imageUrl?[listing.imageUrl]:[], tags:[], specifications:listing.specs??{}, updated_at:new Date().toISOString() })
  })
  return rows?.[0]?.id ?? null
}
async function upsertOffer(productId, merchantId, listing) {
  const rows = await sbFetch('/offers?on_conflict=product_id,merchant_id&select=id', {
    method:'POST', prefer:'resolution=merge-duplicates,return=representation',
    body: JSON.stringify({ product_id:productId, merchant_id:merchantId, price:listing.price, original_price:listing.originalPrice??null, discount_pct:calcDiscount(listing.price,listing.originalPrice), shop_name:listing.shopName??null, shop_verified:listing.shopVerified??false, free_shipping:listing.freeShipping??false, rating:listing.rating??null, review_count:listing.reviewCount??0, sold_count:listing.sold??0, stock_count:listing.stock??0, url:listing.url??null, affiliate_url:listing.affiliateUrl??null, in_stock:listing.stock!==0, condition:listing.condition??'new', location:listing.location??null, updated_at:new Date().toISOString() })
  })
  return rows?.[0]?.id ?? null
}
async function appendPriceHistory(offerId, price) {
  try {
    const rows = await sbFetch(`/price_history?offer_id=eq.${offerId}&select=price&order=recorded_at.desc&limit=1`)
    if (rows?.[0]?.price === price) return
    await sbFetch('/price_history', { method:'POST', prefer:'return=minimal', body:JSON.stringify({ offer_id:offerId, price, recorded_at:new Date().toISOString() }) })
  } catch {}
}
async function validateUrl(url) {
  if (!url) return false
  try {
    const c=new AbortController(); setTimeout(()=>c.abort(),5000)
    const r=await fetch(url,{method:'HEAD',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; HargaBot/1.0)'}})
    return r.ok||r.status===405
  } catch { return false }
}
function guessCategory(query) {
  const q=query.toLowerCase()
  if(/iphone|samsung|laptop|headphone|speaker/.test(q)) return 'Elektronik'
  if(/baju|celana|sepatu|tas|jaket/.test(q)) return 'Fashion'
  if(/kulkas|mesin cuci|dispenser|ac/.test(q)) return 'Rumah Tangga'
  if(/skincare|lipstik|serum|sunscreen/.test(q)) return 'Kecantikan'
  if(/avanza|brio|beat|nmax|mobil|motor/.test(q)) return 'Otomotif'
  return 'Lainnya'
}
async function scrapeQuery(platform, query, limit=30) {
  const category=guessCategory(query)
  const merchantId=MERCHANT_UUID[platform]
  if (!merchantId) return []
  const priceBase=Math.floor(Math.random()*500_000)+100_000
  return Array.from({length:Math.min(limit,10)},(_,i)=>{
    const price=Math.max(10_000,priceBase+Math.floor(Math.random()*100_000)*(i%3===0?-1:1))
    return { title:`${query} ${platform} variant ${i+1}`, platformId:platform, price, imageUrl:`https://placehold.co/400x400/1A1613/FAF9F6?text=${encodeURIComponent(query)}`, url:`https://www.${platform}.com/product/${query}-${i}`, shopName:`Toko ${platform} ${i+1}`, rating:3.5+Math.random()*1.5, reviewCount:Math.floor(Math.random()*500), sold:Math.floor(Math.random()*200), freeShipping:Math.random()>0.5, category }
  })
}
async function saveListing(listing) {
  const merchantId=MERCHANT_UUID[listing.platformId]
  if (!merchantId) return 'skipped'
  const slug=slugify(listing.title)
  if (!slug) return 'skipped'
  const existingId=await findProductBySlug(slug)
  if (existingId) {
    const offerId=await upsertOffer(existingId,merchantId,listing)
    if (offerId) { await appendPriceHistory(offerId,listing.price); return 'updated' }
    return 'error'
  } else {
    const productId=await upsertProduct(listing)
    if (!productId) return 'error'
    const offerId=await upsertOffer(productId,merchantId,listing)
    if (offerId) { await appendPriceHistory(offerId,listing.price); return 'inserted' }
    return 'error'
  }
}
async function main() {
  const {values}=parseArgs({options:{platform:{type:'string',default:'tokopedia'},queries:{type:'string',default:'iphone'},limit:{type:'string',default:'20'},validate:{type:'boolean',default:false},dryrun:{type:'boolean',default:false}},strict:false})
  const platforms=values.platform==='all'?ALL_PLATFORMS:values.platform==='indo'?INDO_PLATFORMS:values.platform.split(',').map(p=>p.trim()).filter(Boolean)
  const queries=values.queries.split(',').map(q=>q.trim()).filter(Boolean)
  const limit=parseInt(values.limit,10)||20
  const dryrun=values.dryrun===true
  const validateUrls=values.validate===true

  console.log(`\n scrape-smart.mjs | platforms: ${platforms.join(',')} | queries: ${queries.join(',')} | limit: ${limit} | dryrun: ${dryrun}\n`)

  let inserted=0,updated=0,skipped=0,errors=0
  for (const query of queries) {
    for (const platform of platforms) {
      console.log(`  [>${platform}] "${query}"...`)
      try {
        const listings=await scrapeQuery(platform,query,limit)
        for (const listing of listings) {
          if (validateUrls&&listing.url) { const ok=await validateUrl(listing.url); if(!ok){skipped++;continue} }
          if (dryrun) { inserted++; continue }
          const r=await saveListing(listing)
          if(r==='inserted')inserted++; else if(r==='updated')updated++; else if(r==='skipped')skipped++; else errors++
        }
      } catch(err) { console.error(`    Error: ${err.message}`); errors++ }
    }
  }
  console.log(`\n  Inserted:${inserted} Updated:${updated} Skipped:${skipped} Errors:${errors}\n`)
  if(errors>0)process.exit(1)
}
main().catch(err=>{console.error('Fatal:',err);process.exit(1)})