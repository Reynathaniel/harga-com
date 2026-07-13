---
name: harga-com-workflow
description: >
  Expert workflow skill for the harga.com price-comparison app (Next.js 14 + Supabase + Vercel).
  Use this skill whenever working on the harga.com project — pushing code to GitHub, monitoring
  Vercel builds and auto-fixing errors, running OLX/marketplace scrapers, managing Supabase data,
  fixing category/filter bugs, or scraping product images. Automatically triggers when the user
  mentions: deploy error, build failed, scrape OLX, fix categories, push to GitHub, Vercel build,
  price format, filter kota/tahun, Supabase products, or any harga.com task.
---

# Harga.com Workflow Skill

Full-stack workflow for the harga.com Next.js price-comparison app.
Project root: `D:\10. BUILD YOUR DREAM\07_HARGA_COM\app` → bash: `/sessions/dazzling-youthful-gauss/mnt/app/`

## Credentials (always available)

```
GitHub Token:       → in git remote URL: git -C /sessions/.../mnt/app remote get-url origin
GitHub Repo:        Reynathaniel/harga-com
Supabase URL:       https://rtdbfbmbvuqentvxcstf.supabase.co
Supabase Svc Key:   → in .env.local: SUPABASE_SERVICE_ROLE_KEY
Supabase Anon Key:  → in .env.local: NEXT_PUBLIC_SUPABASE_ANON_KEY
Vercel Team ID:     team_k4ilEqDogEwqjFNBC4sKrIrt
Vercel Project:     harga-com
OLX Merchant UUID:  00000000-0000-0000-0000-000000000011
Carousell UUID:     00000000-0000-0000-0000-000000000012
```

Read credentials at session start:
```bash
GITHUB_TOKEN=$(git -C /sessions/dazzling-youthful-gauss/mnt/app remote get-url origin | sed 's|.*:\(.*\)@github.*|\1|')
SUPABASE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY /sessions/dazzling-youthful-gauss/mnt/app/.env.local | cut -d= -f2)
SUPABASE_URL=https://rtdbfbmbvuqentvxcstf.supabase.co
```

---

## 1. Pushing Files to GitHub (CRITICAL — git is in broken rebase state)

**Never use `git push`** — always use GitHub REST API directly.

```python
import base64, json, urllib.request, urllib.parse

def push_file(local_path, gh_path, message, token=None, repo="Reynathaniel/harga-com"):
    # token = read from git remote: git remote get-url origin | extract token part
    encoded = urllib.parse.quote(gh_path, safe='/')
    # Get current SHA
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/contents/{encoded}?ref=main",
        headers={"Authorization": f"token {token}"}
    )
    try:
        sha = json.loads(urllib.request.urlopen(req).read()).get('sha', '')
    except: sha = ''
    # Push
    content = base64.b64encode(open(local_path,'rb').read()).decode()
    payload = json.dumps({"message": message, "content": content, "sha": sha, "branch": "main"}).encode()
    req2 = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/contents/{encoded}",
        data=payload, method="PUT",
        headers={"Authorization": f"token {token}", "Content-Type": "application/json"}
    )
    d = json.loads(urllib.request.urlopen(req2).read())
    return d.get('commit',{}).get('sha','')[:8]
```

**IMPORTANT for large files (>6KB):** Always read the FULL file from disk with `open(..., 'rb').read()` — never use `Read` tool content (it may be truncated in context). The bash path `/sessions/dazzling-youthful-gauss/mnt/app/src/...` maps to `D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\src\...` in Windows.

Files with brackets in path (`produk/[id]/page.tsx`) need URL encoding: `%5Bid%5D`.

---

## 2. Vercel Deploy Monitoring & Auto-Fix Loop

After every push, monitor the Vercel build and fix errors automatically:

```python
# Use Vercel MCP tools:
# mcp__847a5e61...__list_deployments(projectId="harga-com", teamId="team_k4ilEqDogEwqjFNBC4sKrIrt")
# mcp__847a5e61...__get_deployment_build_logs(idOrUrl=<dpl_id>, teamId=..., errorsOnly=True)
```

**Auto-fix loop:**
1. After pushing, wait ~30s then check latest deployment state
2. If `state == "ERROR"`: get build logs with `errorsOnly=True`
3. Parse error: file path + line number are always in the log
4. Common errors:
   - **Truncated file** (`Unexpected eof`, `Expected '}'`): fetch full file from last good GitHub commit, re-apply patch, re-push
   - **TypeScript type error**: read the file, fix the type, re-push
   - **Missing import**: add the import, re-push
5. Re-push the fixed file → repeat until `state == "READY"`

**Getting last good file from GitHub:**
```python
# Fetch from a specific good commit SHA
def fetch_from_github(gh_path, sha, token):
    encoded = urllib.parse.quote(gh_path, safe='/')
    url = f"https://api.github.com/repos/Reynathaniel/harga-com/contents/{encoded}?ref={sha}"
    d = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": f"token {token}"})).read())
    return base64.b64decode(d['content'].replace('\n','')).decode('utf-8')
```

Last known good commit: see `git log --oneline` — use most recent clean commit before a bad push.

---

## 3. OLX Scraper Pattern

Run from `/sessions/dazzling-youthful-gauss/mnt/app/` (has node_modules with @supabase/supabase-js).

### OLX API v4 — Critical facts (verified)

```javascript
// CORRECT endpoint (no "q=" — use "query="):
const params = new URLSearchParams({ query: q, page: String(page), size: '40', location_id: '1000000' })
const res = await fetch('https://www.olx.co.id/api/relevance/v4/search?' + params, {
  headers: { Accept: 'application/json', Referer: 'https://www.olx.co.id', 'x-requested-with': 'XMLHttpRequest' }
})
const d = await res.json()
// CORRECT path — ads are at d.data (NOT d.data.ads — that was a bug)
const ads = Array.isArray(d.data) ? d.data : []
```

**Key field paths in each ad object:**
```javascript
ad.id                      // listing ID (use .slice(-6) for slug suffix)
ad.title                   // listing title
ad.price.value.raw         // price as integer (IDR)
ad.images[0].url           // image URL (apollo.olx.co.id — needs Referer to load)
ad.url                     // listing URL (full https://...)
ad.locations[0].name       // city/location — use locations[] array, NOT location.name
ad.user.name               // seller name
```

**Category validation rules (prevent contamination):**
- `Motor Bekas`: title must include brand/model keyword. Min price Rp 2,000,000.
- `Mobil Bekas`: title must include car brand/model. Min price Rp 20,000,000.
- `Rumah Bekas`: use query "rumah dijual". Min price Rp 50,000,000.
- `Tanah Bekas`: use query "tanah dijual". Min price Rp 10,000,000.

**Image proxying (required — apollo.olx.co.id blocks direct browser loading):**
```javascript
async function proxyImg(url, filename) {
  if (!url || url.includes('supabase.co')) return url || null
  const res = await fetch(url, { headers: { Referer: 'https://www.olx.co.id/' }, signal: AbortSignal.timeout(6000) })
  if (!res.ok) return null
  const buf = await res.arrayBuffer()
  await supabase.storage.from('product-images').upload('olx/' + filename, buf, { contentType: 'image/webp', upsert: true })
  return SUPABASE_URL + '/storage/v1/object/public/product-images/olx/' + filename
}
// Filename pattern: slug.slice(0,58) + '.webp'
```

**Correct DB column names (verified against schema):**
```javascript
// products table — upsert on 'slug'
await supabase.from('products').upsert({
  name, slug, category, brand: '',
  images: [proxiedUrl],        // images[] array
  image_url: proxiedUrl,       // also set image_url (TEXT column)
  description: title,
  specifications: {}           // JSONB column — NOT 'specs'
}, { onConflict: 'slug' })

// offers table — upsert on 'product_id,merchant_id'
await supabase.from('offers').upsert({
  product_id, merchant_id: OLX_UUID,
  price, original_price: price,
  discount_pct: 0, free_shipping: false,
  shop_verified: false,
  shop_name: ad.user?.name || 'OLX Seller',
  url: shopUrl,               // column is 'url' NOT 'shop_url'
  affiliate_url: shopUrl,
  condition: 'used',
  location,                   // from ad.locations[0].name
  in_stock: true
}, { onConflict: 'product_id,merchant_id' })
```

**Slug pattern:**
```javascript
function slugify(title, id) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)
    + '-olx-' + String(id).slice(-6)
}
```

**Scraping script template** (save to `/sessions/dazzling-youthful-gauss/mnt/app/scrape-extra.mjs`, run with `node scrape-extra.mjs motor|mobil|rumah|tanah`):
— See session for full working script. Key: must run from app dir, uses ES modules.

---

## 4. Supabase Data Fixes

**Category breakdown query:**
```bash
curl -s -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/products?select=category&limit=1000&offset=N"
```

**Fix wrong categories (batch SQL via Supabase MCP):**
```sql
-- Move non-motor items out of Motor Bekas
UPDATE products SET category = 'Lainnya' 
WHERE category = 'Motor Bekas' 
AND name ~* '(karung|botol|plastik|hel