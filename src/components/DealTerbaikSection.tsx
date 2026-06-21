'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/lib/types'

interface Props {
  allProducts: Product[]
  usedProducts: Product[]
}

export function DealTerbaikSection({ allProducts, usedProducts }: Props) {
  const [tab, setTab] = useState<'all' | 'new' | 'used'>('all')

  const products = tab === 'used' ? usedProducts : allProducts
  const viewAllHref = tab === 'used' ? '/cari?condition=used' : tab === 'new' ? '/cari?condition=new&sort=popular' : '/cari?sort=popular'

  const TABS = [
    { key: 'all',  label: 'Semua' },
    { key: 'new',  label: 'Baru' },
    { key: 'used', label: 'Bekas' },
  ] as const

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* Section header */}
      <div className="reveal flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase' as const,
            color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: 6,
          }}>Pilihan Hari Ini</div>
          <h2 style={{
            margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 400,
            color: 'var(--text-primary)', fontFamily: 'var(--font-editorial)',
            letterSpacing: '-0.01em',
          }}>Deal Terbaik</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 2,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: 4,
          }}>
            {TABS.map(t => (
              <button key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '6px 16px', borderRadius: 8,
                  background: tab === t.key ? 'var(--brand)' : 'transparent',
                  color: tab === t.key ? '#fff' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
                  fontFamily: 'var(--font-ui)',
                  transition: 'all 0.15s ease',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* View all link */}
          <Link href={viewAllHref}
            className="flex items-center gap-1 transition-colors"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', textDecoration: 'none' }}>
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 reveal-grid">
        {products.slice(0, 10).map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {tab === 'used' && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
            background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)',
          }}>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>♻️ Barang Bekas</span>
          <span>·</span>
          <span>Harga lebih hemat, kondisi terpilih. Verifikasi penjual sebelum bertransaksi.</span>
        </div>
      )}
    </section>
  )
}