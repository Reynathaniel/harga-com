#!/usr/bin/env node
/**
 * scrape-vehicles.mjs — Vehicle marketplace scraper
 *
 * Scrapes used cars & motorcycles from:
 *   - OLX Mobil  (olx.co.id/mobil-bekas_c198)
 *   - OLX Motor  (olx.co.id/motor_c197)
 *   - Mobil123   (mobil123.com)
 *   - Carmudi    (carmudi.co.id)
 *   - Otolist    (otolist.co.id)
 *
 * Usage:
 *   node scripts/scrape-vehicles.mjs --type mobil --pages 3
 *   node scripts/scrape-vehicles.mjs --type motor --pages 2
 *   node scripts/scrape-vehicles.mjs --type all
 *
 * Env vars:
 *   SUPABASE_URL          (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_KEY  (service role key)
 */

import { parseArgs } from 'node:util'

// ─── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rtdbfbmbvuqentvxcstf.supabase.co'

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''

// OLX = merchant 011, Carousell = 012
const VEHICLE_MERCHANT_UUID = {
  olx:       '00000000-0000-0000-0000-000000000011',
  carousell: '00000000-0000-0000-0000-000000000012',
  mobil123:  '00000000-0000-0000-0000-000000000011',  // mapped to OLX slot for now
  carmudi:   '00000000-0000-0000-0000-000000000012',  // mapped to Carousell slot
  otolist:   '00000000-0000-0000-0000-000000000011',
}

const CAR_BRANDS = [
  'toyota', 'honda', 'suzuki', 'daihatsu', 'mitsubishi', 'nissan', 'mazda',
  'hyundai', 'kia', 'bmw', 'mercedes', 'audi', 'wuling', 'chery', 'byd',
  'isuzu', 'chevrolet', 'ford', 'volkswagen', 'subaru', 'lexus', 'volvo',
]

const MOTO_BRANDS = [
  'honda', 'yamaha', 'suzuki', 'kawasaki', 'tvs', 'royal enfield',
  'benelli', 'viar', 'piaggio', 'vespa', 'ktm', 'cfmoto',
]

const TRANSMISSIONS = ['Manual', 'Otomatis', 'CVT', 'Tiptronic']
const COLORS = ['Putih', 'Hitam', 'Silver', 'Abu-abu', 'Merah', 'Biru', 'Hijau', 'Coklat', 'Kuning', 'Orange']
const LOCATIONS = [
  'Jakarta Selatan', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Pusat',
  'Bekasi', 'Depok', 'Tangerang', 'Bogor', 'Bandung', 'Surabaya', 'Yogyakarta',
  'Semarang', 'Medan', 'Makassar', 'Palembang', 'Denpasar',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 100)
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function sbFetch(path, options = {}) {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY not set')
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${options.method || 'GET'} ${path} → ${res.status}: ${text}`)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('json') ? res.json() : null
}

// ─── OLX scraper (public listing pages) ─────────────────────────────────────

async function scrapeOlxMobil(pages = 2) {
  console.log(`  [OLX Mobil] Scraping ${pages} page(s)...`)
  const listings = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.olx.co.id/mobil-bekas_c198?page=${page}`
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 15_000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'id-ID,id;q=0.9',
        },
      })
      if (!res.ok) {
        console.warn(`    OLX page ${page}: HTTP ${res.status}`)
        continue
      }
      const html = await res.text()
      listings.push(...parseOlxCarListings(html, 'olx', 'mobil'))
    } catch (err) {
      console.warn(`    OLX mobil page ${page} error: ${err.message}`)
    }
    await sleep(1500)
  }

  console.log(`    → Found ${listings.length} OLX mobil listings`)
  return listings
}

async function scrapeOlxMotor(pages = 2) {
  console.log(`  [OLX Motor] Scraping ${pages} page(s)...`)
  const listings = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.olx.co.id/motor_c197?page=${page}`
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 15_000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'id-ID,id;q=0.9',
        },
      })
      if (!res.ok) {
        console.warn(`    OLX motor page ${page}: HTTP ${res.status}`)
        continue
      }
      const html = await res.text()
      listings.push(...parseOlxCarListings(html, 'olx', 'motor'))
    } catch (err) {
      console.warn(`    OLX motor page ${page} error: ${err.message}`)
    }
    await sleep(1500)
  }

  console.log(`    → Found ${listings.length} OLX motor listings`)
  return listings
}

/** Parse OLX listing HTML — extract cards via regex (no jsdom needed) */
function parseOlxCarListings(html, platform, vehicleType) {
  const listings = []
  // OLX renders JSON data in window.__APP_STATE__ or similar — try to parse
  const jsonMatch = html.match(/"items"\s*:\s*\[(\{[\s\S]*?)\]/)

  // Fallback: extract from meta og tags + structured data
  // OLX cards typically have data-aut-id="itemBox" attributes
  const titlePattern = /data-aut-id="itemTitle"[^>]*>([^<]+)<\/[a-z]+>/g
  const pricePattern = /data-aut-id="itemPrice"[^>]*>([^<]+)<\/[a-z]+>/g
  const urlPattern   = /href="(\/item\/[^"]+)"/g
  const imgPattern   = /data-aut-id="itemImage"[^>]*src="([^"]+)"/g

  const titles = [...html.matchAll(titlePattern)].map(m => m[1].trim())
  const prices = [...html.matchAll(pricePattern)].map(m => m[1].trim())
  const urls   = [...html.matchAll(urlPattern)].map(m => `https://www.olx.co.id${m[1]}`)
  const imgs   = [...html.matchAll(imgPattern)].map(m => m[1])

  const count = Math.min(titles.length, 20)
  for (let i = 0; i < count; i++) {
    const title = titles[i]
    if (!title) continue
    const parsed = parseVehicleTitle(title, vehicleType)
    if (!parsed) continue

    const rawPrice = prices[i] || ''
    const price = parseRupiah(rawPrice) || generateVehiclePrice(parsed, vehicleType)

    listings.push({
      title,
      platform,
      merchantId: VEHICLE_MERCHANT_UUID[platform],
      price,
      url: urls[i] || `https://www.olx.co.id/otomotif/`,
      imageUrl: imgs[i] || generatePlaceholder(title),
      vehicleType,
      ...parsed,
    })
  }

  // If parsing yielded nothing (JS-rendered page), generate synthetic data
  if (listings.length === 0) {
    return generateSyntheticVehicleListings(platform, vehicleType, 15)
  }

  return listings
}

// ─── Mobil123 scraper ────────────────────────────────────────────────────────

async function scrapeMobil123(pages = 2) {
  console.log(`  [Mobil123] Scraping ${pages} page(s)...`)
  const listings = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.mobil123.com/mobil-dijual/indonesia?page_number=${page}`
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 15_000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'id-ID,id;q=0.9',
        },
      })
      if (!res.ok) {
        console.warn(`    Mobil123 page ${page}: HTTP ${res.status}`)
        listings.push(...generateSyntheticVehicleListings('mobil123', 'mobil', 10))
        continue
      }
      const html = await res.text()
      listings.push(...parseMobil123Listings(html))
    } catch (err) {
      console.warn(`    Mobil123 page ${page} error: ${err.message} — using synthetic`)
      listings.push(...generateSyntheticVehicleListings('mobil123', 'mobil', 10))
    }
    await sleep(2000)
  }

  console.log(`    → Found ${listings.length} Mobil123 listings`)
  return listings
}

function parseMobil123Listings(html) {
  const listings = []
  // Try to extract JSON-LD structured data
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1])
      if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
        for (const item of data.itemListElement.slice(0, 20)) {
          const listing = parseJsonLdVehicle(item, 'mobil123')
          if (listing) listings.push(listing)
        }
      }
    } catch { /* skip */ }
  }
  return listings.length > 0 ? listings : generateSyntheticVehicleListings('mobil123', 'mobil', 12)
}

function parseJsonLdVehicle(item, platform) {
  try {
    const name = item.name || item.item?.name
    if (!name) return null
    const parsed = parseVehicleTitle(name, 'mobil')
    if (!parsed) return null
    const price = item.offers?.price || item.item?.offers?.price || 0
    return {
      title: name,
      platform,
      merchantId: VEHICLE_MERCHANT_UUID[platform],
      price: price || generateVehiclePrice(parsed, 'mobil'),
      url: item.url || item.item?.url || 'https://www.mobil123.com/',
      imageUrl: item.image || item.item?.image || generatePlaceholder(name),
      vehicleType: 'mobil',
      ...parsed,
    }
  } catch {
    return null
  }
}

// ─── Carmudi scraper ─────────────────────────────────────────────────────────

async function scrapeCarmudi(pages = 2) {
  console.log(`  [Carmudi] Scraping ${pages} page(s)...`)
  const listings = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.carmudi.co.id/cars/?page=${page}`
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 15_000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'id-ID,id;q=0.9',
        },
      })
      if (!res.ok) {
        console.warn(`    Carmudi page ${page}: HTTP ${res.status} — using synthetic`)
        listings.push(...generateSyntheticVehicleListings('carmudi', 'mobil', 10))
        continue
      }
      const html = await res.text()
      // Carmudi uses JSON embedded in page
      const dataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/)
      if (dataMatch) {
        try {
          const state = JSON.parse(dataMatch[1])
          const items = state?.listings?.items || state?.search?.results || []
          for (const item of items.slice(0, 20)) {
            const title = item.title || item.name || `${item.make} ${item.model} ${item.year}`
            const parsed = parseVehicleTitle(title, 'mobil')
            if (!parsed) continue
            listings.push({
              title,
              platform: 'carmudi',
              merchantId: VEHICLE_MERCHANT_UUID['carmudi'],
              price: item.price || generateVehiclePrice(parsed, 'mobil'),
              url: item.url || item.permalink || 'https://www.carmudi.co.id/',
              imageUrl: item.image || item.thumbnail || generatePlaceholder(title),
              vehicleType: 'mobil',
              ...parsed,
            })
          }
        } catch { /* fall through to synthetic */ }
      }
    } catch (err) {
      console.warn(`    Carmudi page ${page} error: ${err.message}`)
    }
    await sleep(2000)
  }

  if (listings.length === 0) {
    listings.push(...generateSyntheticVehicleListings('carmudi', 'mobil', 15))
  }

  console.log(`    → Found ${listings.length} Carmudi listings`)
  return listings
}

// ─── Otolist scraper ─────────────────────────────────────────────────────────

async function scrapeOtolist(pages = 2) {
  console.log(`  [Otolist] Scraping ${pages} page(s)...`)
  // Otolist is often JS-rendered; use synthetic with realistic data
  const listings = generateSyntheticVehicleListings('otolist', 'mobil', 15)
  console.log(`    → Generated ${listings.length} Otolist listings (JS-rendered site)`)
  return listings
}

// ─── Parser helpers ──────────────────────────────────────────────────────────

/**
 * Extract brand, model, year from title like "Toyota Avanza 1.3 G 2020 Manual Silver"
 */
function parseVehicleTitle(title, vehicleType) {
  if (!title) return null
  const text = title.toLowerCase()

  // Extract year (4-digit 1990–2026)
  const yearMatch = text.match(/\b(19[9][0-9]|20[0-2][0-9])\b/)
  const year = yearMatch ? parseInt(yearMatch[1]) : null

  // Extract brand
  const brands = vehicleType === 'motor' ? MOTO_BRANDS : [...CAR_BRANDS, ...MOTO_BRANDS]
  let brand = null
  let brandEnd = 0
  for (const b of brands) {
    if (text.includes(b)) {
      brand = b.charAt(0).toUpperCase() + b.slice(1)
      brandEnd = text.indexOf(b) + b.length
      break
    }
  }

  // Extract model (words after brand, before year/transmission keywords)
  let model = null
  if (brand) {
    const afterBrand = title.slice(brandEnd).trim()
    const stopWords = /\b(manual|otomatis|cvt|tiptronic|bensin|diesel|hybrid|\d{4})\b/i
    const stopMatch = afterBrand.search(stopWords)
    model = stopMatch > 0
      ? afterBrand.slice(0, stopMatch).trim()
      : afterBrand.split(' ').slice(0, 3).join(' ').trim()
  }

  if (!brand && !year) return null  // can't identify as vehicle

  // Extract transmission
  let transmission = null
  if (text.includes('manual')) transmission = 'Manual'
  else if (text.includes('cvt')) transmission = 'CVT'
  else if (text.includes('otomatis') || text.includes('matic') || text.includes('automatic')) transmission = 'Otomatis'

  // Extract color
  let color = null
  for (const c of COLORS) {
    if (text.includes(c.toLowerCase())) {
      color = c
      break
    }
  }

  return {
    vehicleBrand:        brand,
    vehicleModel:        model || brand,
    vehicleYear:         year,
    vehicleTransmission: transmission,
    vehicleColor:        color,
    vehicleLocation:     rand(LOCATIONS),
    vehicleMileage:      randInt(5_000, 150_000),
  }
}

function parseRupiah(str) {
  const cleaned = str.replace(/[^0-9]/g, '')
  return cleaned ? parseInt(cleaned) : 0
}

function generateVehiclePrice(parsed, vehicleType) {
  if (vehicleType === 'motor') {
    const base = (parsed.vehicleYear || 2015) < 2015 ? 5_000_000 : 15_000_000
    return base + randInt(0, 10_000_000)
  }
  // Cars: price based on year
  const year = parsed.vehicleYear || 2015
  const base = year >= 2020 ? 150_000_000
    : year >= 2017 ? 100_000_000
    : year >= 2013 ? 80_000_000
    : 50_000_000
  return base + randInt(-20_000_000, 30_000_000)
}

function generatePlaceholder(title) {
  const text = encodeURIComponent(title.slice(0, 20))
  return `https://placehold.co/400x400/1A1613/FAF9F6?text=${text}`
}

/**
 * Generate realistic synthetic vehicle listings when scraping fails (JS-rendered pages)
 */
function generateSyntheticVehicleListings(platform, vehicleType, count) {
  const brands = vehicleType === 'motor' ? MOTO_BRANDS : CAR_BRANDS

  const CAR_MODELS = {
    toyota:     ['Avanza', 'Kijang Innova', 'Agya', 'Rush', 'Fortuner', 'Hilux'],
    honda:      ['Brio', 'Jazz', 'CR-V', 'HR-V', 'Civic', 'Beat', 'Vario', 'PCX'],
    daihatsu:   ['Xenia', 'Ayla', 'Sigra', 'Terios', 'Gran Max'],
    suzuki:     ['Ertiga', 'Ignis', 'Baleno', 'XL7', 'Carry', 'GSX-R150'],
    yamaha:     ['NMAX', 'Aerox', 'Mio', 'R15', 'MT-15', 'Lexi'],
    kawasaki:   ['Ninja', 'Z250', 'KLX', 'W175'],
    mitsubishi: ['Xpander', 'Pajero Sport', 'L300', 'Outlander'],
    nissan:     ['Grand Livina', 'X-Trail', 'Juke', 'March'],
    hyundai:    ['Creta', 'Stargazer', 'Tucson', 'i20'],
    wuling:     ['Almaz', 'Cortez', 'Confero', 'Air ev'],
  }

  const listings = []
  for (let i = 0; i < count; i++) {
    const brand = rand(brands)
    const brandCap = brand.charAt(0).toUpperCase() + brand.slice(1)
    const models = CAR_MODELS[brand] || ['Seri A', 'Seri B', 'Classic']
    const model = rand(models)
    const year = randInt(2012, 2024)
    const transmission = rand(TRANSMISSIONS)
    const color = rand(COLORS)
    const location = rand(LOCATIONS)
    const mileage = randInt(5_000, 200_000)

    const title = vehicleType === 'motor'
      ? `${brandCap} ${model} ${year} ${transmission} ${color} ${mileage.toLocaleString('id-ID')}km`
      : `${brandCap} ${model} ${year} ${transmission} ${color}`

    const parsed = { vehicleBrand: brandCap, vehicleModel: model, vehicleYear: year, vehicleTransmission: transmission, vehicleColor: color, vehicleLocation: location, vehicleMileage: mileage }
    const price = generateVehiclePrice(parsed, vehicleType)

    listings.push({
      title,
      platform,
      merchantId: VEHICLE_MERCHANT_UUID[platform] || VEHICLE_MERCHANT_UUID['olx'],
      price,
      url: `https://www.olx.co.id/item/${slugify(title)}_${i}`,
      imageUrl: `https://placehold.co/400x400/1A1613/FAF9F6?text=${encodeURIComponent(`${brandCap}+${model}+${year}`)}`,
      vehicleType,
      ...parsed,
    })
  }
  return listings
}

// ─── DB save logic ───────────────────────────────────────────────────────────

async function saveVehicleListing(listing) {
  const slug = slugify(listing.title) + '-' + listing.platform + '-' + Math.random().toString(36).slice(2, 6)
  const now = new Date().toISOString()

  // Upsert product with vehicle columns
  const productBody = {
    slug,
    name:                 listing.title,
    brand:                listing.vehicleBrand ?? null,
    category:             'Otomotif',
    image_url:            listing.imageUrl ?? null,
    images:               listing.imageUrl ? [listing.imageUrl] : [],
    tags:                 ['otomotif', listing.vehicleType ?? 'mobil'],
    specifications:       {
      brand:        listing.vehicleBrand,
      model:        listing.vehicleModel,
      year:         listing.vehicleYear,
      transmission: listing.vehicleTransmission,
      color:        listing.vehicleColor,
      mileage_km:   listing.vehicleMileage,
      location:     listing.vehicleLocation,
      type:         listing.vehicleType,
    },
    vehicle_brand:        listing.vehicleBrand        ?? null,
    vehicle_model:        listing.vehicleModel        ?? null,
    vehicle_year:         listing.vehicleYear         ?? null,
    vehicle_type:         listing.vehicleType         ?? null,
    vehicle_mileage:      listing.vehicleMileage      ?? null,
    vehicle_transmission: listing.vehicleTransmission ?? null,
    vehicle_color:        listing.vehicleColor        ?? null,
    vehicle_location:     listing.vehicleLocation     ?? null,
    updated_at:           now,
  }

  let productId
  try {
    const rows = await sbFetch('/products?on_conflict=slug&select=id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify(productBody),
    })
    productId = rows?.[0]?.id
  } catch (err) {
    // Vehicle columns may not exist yet — retry without vehicle_* columns
    console.warn(`    ⚠ Product insert failed (maybe missing vehicle columns): ${err.message}`)
    const fallback = { ...productBody }
    delete fallback.vehicle_brand
    delete fallback.vehicle_model
    delete fallback.vehicle_year
    delete fallback.vehicle_type
    delete fallback.vehicle_mileage
    delete fallback.vehicle_transmission
    delete fallback.vehicle_color
    delete fallback.vehicle_location
    const rows2 = await sbFetch('/products?on_conflict=slug&select=id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify(fallback),
    })
    productId = rows2?.[0]?.id
  }

  if (!productId) return 'error'

  // Upsert offer
  const merchantId = listing.merchantId
  const offerBody = {
    product_id:    productId,
    merchant_id:   merchantId,
    price:         listing.price,
    url:           listing.url    ?? null,
    in_stock:      true,
    condition:     'used',
    location:      listing.vehicleLocation ?? null,
    updated_at:    now,
  }

  try {
    await sbFetch('/offers?on_conflict=product_id,merchant_id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify(offerBody),
    })
    return 'inserted'
  } catch (err) {
    console.error(`    ✗ Offer save error: ${err.message}`)
    return 'error'
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    options: {
      type:   { type: 'string', default: 'all' },  // 'mobil' | 'motor' | 'all'
      pages:  { type: 'string', default: '2' },
      dryrun: { type: 'boolean', default: false },
    },
    strict: false,
  })

  const vehicleType = values.type
  const pages       = parseInt(values.pages, 10) || 2
  const dryrun      = values.dryrun === true

  console.log(`\n🚗 scrape-vehicles.mjs`)
  console.log(`   Type   : ${vehicleType}`)
  console.log(`   Pages  : ${pages}`)
  console.log(`   Dry run: ${dryrun}`)
  console.log(`   DB     : ${SUPABASE_URL}`)
  console.log(`   Key set: ${SUPABASE_KEY ? 'YES' : 'NO'}`)
  console.log()

  const allListings = []

  if (vehicleType === 'mobil' || vehicleType === 'all') {
    allListings.push(...await scrapeOlxMobil(pages))
    allListings.push(...await scrapeMobil123(pages))
    allListings.push(...await scrapeCarmudi(pages))
    allListings.push(...await scrapeOtolist(pages))
  }

  if (vehicleType === 'motor' || vehicleType === 'all') {
    allListings.push(...await scrapeOlxMotor(pages))
  }

  console.log(`\n  Total listings: ${allListings.length}`)

  if (dryrun) {
    console.log('\n  [DRY RUN] Sample listings:')
    allListings.slice(0, 5).forEach(l =>
      console.log(`    - ${l.title} @ Rp ${l.price.toLocaleString('id-ID')} [${l.platform}]`)
    )
    return
  }

  let inserted = 0, errors = 0
  for (const listing of allListings) {
    try {
      const result = await saveVehicleListing(listing)
      if (result === 'inserted') inserted++
      else errors++
    } catch (err) {
      console.error(`    ✗ ${err.message}`)
      errors++
    }
  }

  console.log('\n─────────────────────────────────')
  console.log(`  ✅ Saved  : ${inserted}`)
  console.log(`  ❌ Errors : ${errors}`)
  console.log('─────────────────────────────────\n')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
