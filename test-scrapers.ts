import { scrapeAll } from './src/lib/scrapers'

async function main() {
  const platforms = ['lazada', 'bukalapak', 'blibli', 'amazon', 'aliexpress', 'tokopedia', 'shopee']
  for (const p of platforms) {
    process.stdout.write(`${p}: `)
    const result = await scrapeAll({ query: 'iphone', platforms: [p], limit: 5, concurrency: 1 })
    console.log(`found=${result.totalFound} errors=${result.errors.map(e=>e.error.slice(0,50)).join(';')}`)
    if (result.merged[0]) console.log(`  sample: ${result.merged[0].title?.slice(0,50)}`)
    await new Promise(r => setTimeout(r, 1500))
  }
}
main().catch(console.error)
