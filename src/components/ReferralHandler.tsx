'use client'

/**
 * ReferralHandler — reads ?ref= URL param and persists to localStorage.
 * Must be a client component so it can access window.location and localStorage.
 * Renders nothing visible; side-effect only.
 *
 * Place this in the root layout so it runs on every page.
 */

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ReferralHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      const safeRef = ref.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 12)
      if (safeRef) {
        localStorage.setItem('harga_referral_code', safeRef)
      }
    }
  }, [searchParams])

  return null
}
