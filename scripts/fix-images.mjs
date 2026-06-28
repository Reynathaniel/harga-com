/**
 * fix-images.mjs
 * Bulk-update all products with placehold.co / null / empty image_url
 * to category-appropriate Unsplash images.
 */

const SUPABASE_URL = 'https://rtdbfbmbvuqentvxcstf.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZGJmYm1idnVxZW50dnhjc3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU5OTgxNSwiZXhwIjoyMDk2MTc1ODE1fQ.akhrx9ql6y3WPfkYY2EJTUvXVByjBjfBT8SxM6dniuI'

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
}

// Category → Unsplash photo IDs
const CATEGORY_PHOTOS = {
  'Mobil Bekas': [
    'photo-1544636331-e26879cd4d9b',
    'photo-1494976388531-d1058494cdd8',
    'photo-1583121274602-3e2820c69888',
    'photo-1549317661-bd32c8ce0db2',
    'photo-1503376780353-7e6692767b70',
  ],
  'Motor Bekas': [
    'photo-1558618666-fcd25c85cd64',
    'photo-1609630875171-b1321377ee65',
    'photo-1449426468159-d96dbf08f19f',
    'photo-1471479917193-f00955256257',
  ],
  'Elektronik': [
    'photo-1498049794561-7780e7231661',
    'photo-1518770660439-4636190af475',
    'photo-1526738549149-8e07eca6c147',
    'photo-1593642632559-0c6d3fc62b89',
  ],
  'Fashion': [
    'photo-1441986300917-64674bd600d8',
    'photo-1542291026-7eec264c27ff',
    'photo-1542272604-787c3835535d',
  ],
  'Kecantikan': [
    'photo-1522335789203-aabd1fc54bc9',
    'photo-1596462502278-27bfdc403348',
    'photo-1571781926291-c477ebfd024b',
  ],
  'Gaming': [
    'photo-1550745165-9bc0b252726f',
    'photo-1592840496694-26d035b52b48',
    'photo-1488590528505-98d2b5aba04b',
  ],
  'Olahraga': [
    'photo-1517836357463-d25dfeac3438',
    'photo-1571019613454-1cb2f99b2d8b',
    'photo-1461896836934-ffe607ba8211',
  ],
  'Rumah Tangga': [
    'photo-1556909114-f6e7ad7d3136',
    'photo-1484154218962-a197022b5858',
    'photo-1556909172-54557c7e4fb7',
  ],
  'Makanan': [
    'photo-1498837167922-ddd27525d352',
    'photo-1546069901-ba9599a7e63c',
    'photo-1504674900247-0877df9cc836',
  ],
}

// Fallback for uncategorized
const FALLBACK_PHOTOS = [
  'photo-1526738549149-8e07eca6c147',
  'photo-1498049794561-7780e7231661',
  'photo-1441986300917-64674bd600d8',
]

function pickPhoto(category, index) {
  const photos = CATEGORY_PHOTOS[category] ?? FALLBACK_PHOTOS
  const photo = photos[index % photos.length]
  return `https://images.unsplash.com/${photo}?w=400&q=80`
}

async function fetchAllBadProducts() {
  const all = []
  let offset = 0
  const pageSize = 200

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/products?select=id,category&image_url=like.*placehold*&limit=${pageSize}&offset=${offset}`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) {
      console.error('Fetch error:', await res.text())
      break
    }
    const rows = await res.json()
    if (rows.length === 0) break
    all.push(...rows)
    offset += rows.length
    console.log(`  Fetched ${all.length} products so far...`)
    if (rows.length < pageSize) break
  }

  // Also fetch null image_url
  offset = 0
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/products?select=id,category&image_url=is.null&limit=${pageSize}&offset=${offset}`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) break
    const rows = await res.json()
    if (rows.length === 0) break
    all.push(...rows)
    offset += rows.length
    if (rows.length < pageSize) break
  }

  // Deduplicate by id
  const seen = new Set()
  return all.filter(r => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}

async function updateBatch(products) {
  const promises = products.map(async (product, i) => {
    const imageUrl = pickPhoto(product.category, i)
    const body = JSON.stringify({
      image_url: imageUrl,
      images: [imageUrl],
    })
    const url = `${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: HEADERS,
      body,
    })
    if (!res.ok) {
      const txt = await res.text()
      console.error(`  Failed to update ${product.id}: ${txt}`)
      return false
    }
    return true
  })

  const results = await Promise.all(promises)
  return results.filter(Boolean).length
}

async function main() {
  console.log('Fetching products with bad image_url...')
  const products = await fetchAllBadProducts()
  console.log(`Found ${products.length} products to update.\n`)

  if (products.length === 0) {
    console.log('Nothing to update.')
    return
  }

  // Group by category for logging
  const byCat = {}
  for (const p of products) {
    byCat[p.category] = (byCat[p.category] || 0) + 1
  }
  console.log('By category:')
  for (const [cat, count] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${count}`)
  }
  console.log()

  // Update in concurrent batches of 20
  const BATCH_SIZE = 20
  let totalUpdated = 0

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const updated = await updateBatch(batch)
    totalUpdated += updated
    process.stdout.write(`\rUpdated ${totalUpdated}/${products.length}...`)
  }

  console.log(`\n\nDone! Updated ${totalUpdated} products.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
