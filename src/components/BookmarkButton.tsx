'use client'
import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'

const STORAGE_KEY = 'harga_bookmarks'

interface Props {
  productId: string
}

export function BookmarkButton({ productId }: Props) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      setSaved(list.includes(productId))
    } catch { /* ignore */ }
  }, [productId])

  const toggle = () => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      const next = list.includes(productId)
        ? list.filter(id => id !== productId)
        : [...list, productId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSaved(next.includes(productId))
    } catch { /* ignore */ }
  }

  return (
    <button
      onClick={toggle}
      title={saved ? 'Hapus dari Simpan' : 'Simpan Produk'}
      className="w-9 h-9 bg-[var(--bg-card)]/90 border rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm hover:scale-105"
      style={{
        borderColor: saved ? 'rgba(245,158,11,0.45)' : 'var(--border-subtle)',
        color: saved ? '#f59e0b' : 'var(--text-muted)',
      }}
    >
      <Bookmark size={15} fill={saved ? '#f59e0b' : 'none'} />
    </button>
  )
}
