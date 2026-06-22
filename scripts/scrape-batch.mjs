#!/usr/bin/env node
/**
 * scrape-batch.mjs — Batch scraper for default keyword list
 *
 * Runs Shopee + TikTok across all default keywords.
 * Edit KEYWORDS below or pass --keywords "kw1,kw2,kw3"
 *
 * Usage:
 *   node scripts/scrape-batch.mjs
 *   node scripts/scrape-batch.mjs --platform shopee
 *   node scripts/scrape-batch.mjs --keywords "iphone,samsung" --limit 20
 *   node scripts/scrape-batch.mjs --dry-run
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { spawnSync } from 'child_process'

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT KEYWORD LIST
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_KEYWORDS = [
  'iphone',
  'samsung galaxy',
  'laptop',
  'airpods',
  'headphone sony',
  'sepatu nike',
  'baju pria',
  'tas wanita',
  'kulkas',
  'TV LED',
]

// ─────────────────────────────────────────────────────────────────────────────
// CLI ARGS
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
      args[key] = val
    }
  }
  return args
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — delegates each keyword to scrape-local.mjs via child process
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv)
  const platform = args.platform ?? 'all'
  const limit    = args.limit ?? '20'
  const dryRun   = args['dry-run'] === true || args['dry-run'] === 'true'

  const keywords = args.keywords
    ? args.keywords.split(',').map(k => k.trim()).filter(Boolean)
    : DEFAULT_KEYWORDS

  console.log(`\n🛒 harga.com batch scraper`)
  console.log(`   platform : ${platform}`)
  console.log(`   keywords : ${keywords.length} keywords`)
  console.log(`   limit    : ${limit} per keyword per platform`)
  if (dryRun) console.log(`   mode     : DRY RUN`)
  console.log(`\n${'─'.repeat(60)}`)

  const start = Date.now()
  let totalKeywords = 0

  for (const keyword of keywords) {
    console.log(`\n▶ Keyword: "${keyword}"`)
    const cliArgs = [
      'scripts/scrape-local.mjs',
      '--platform', platform,
      '--query', keyword,
      '--limit', String(limit),
    ]
    if (dryRun) cliArgs.push('--dry-run')

    // Use spawnSync for clean sequential execution
    const result = spawnSync(process.execPath, cliArgs, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    if (result.status !== 0) {
      console.error(`  [error] scrape-local.mjs exited with code ${result.status}`)
    }

    totalKeywords++

    // Pause between keywords to avoid rate limiting
    if (keywords.indexOf(keyword) < keywords.length - 1) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅ Batch complete: ${totalKeywords} keywords in ${elapsed}s`)
}

main().catch(err => {
  console.error('[fatal]', err)
  process.exit(1)
})
