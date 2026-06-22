import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Price Alert — Pantau Harga & Notifikasi Otomatis | Harga.com',
  description: 'Set target harga dan dapatkan notifikasi via email atau WhatsApp saat harga turun ke target kamu. Gratis dan mudah digunakan di Harga.com.',
}

export default function AlertLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
