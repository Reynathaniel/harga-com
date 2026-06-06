// ============================================================
// harga.com — Database TypeScript Types
// Auto-generated from schema. Re-run `supabase gen types typescript`
// after schema changes to keep this in sync.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string
          name: string
          slug: string
          platform_id: string
          logo_url: string | null
          affiliate_base_url: string | null
          color: string | null
          bg_color: string | null
          cashback_default_pct: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          platform_id: string
          logo_url?: string | null
          affiliate_base_url?: string | null
          color?: string | null
          bg_color?: string | null
          cashback_default_pct?: number
          active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['merchants']['Insert']>
      }

      products: {
        Row: {
          id: string
          name: string
          slug: string
          brand: string | null
          category: string | null
          subcategory: string | null
          description: string | null
          image_url: string | null
          images: string[]
          tags: string[]
          specifications: Json
          average_rating: number | null
          total_reviews: number
          search_vector: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          brand?: string | null
          category?: string | null
          subcategory?: string | null
          description?: string | null
          image_url?: string | null
          images?: string[]
          tags?: string[]
          specifications?: Json
          average_rating?: number | null
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }

      offers: {
        Row: {
          id: string
          product_id: string
          merchant_id: string
          price: number
          original_price: number | null
          discount_pct: number | null
          shop_name: string | null
          shop_verified: boolean
          free_shipping: boolean
          rating: number | null
          review_count: number
          sold_count: number
          stock_count: number
          url: string | null
          affiliate_url: string | null
          in_stock: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          merchant_id: string
          price: number
          original_price?: number | null
          discount_pct?: number | null
          shop_name?: string | null
          shop_verified?: boolean
          free_shipping?: boolean
          rating?: number | null
          review_count?: number
          sold_count?: number
          stock_count?: number
          url?: string | null
          affiliate_url?: string | null
          in_stock?: boolean
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['offers']['Insert']>
      }

      price_history: {
        Row: {
          id: string
          offer_id: string
          price: number
          recorded_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          price: number
          recorded_at?: string
        }
        Update: Partial<Database['public']['Tables']['price_history']['Insert']>
      }

      cashback_rates: {
        Row: {
          id: string
          merchant_id: string
          category: string | null
          rate_percent: number
          valid_from: string
          valid_until: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          category?: string | null
          rate_percent: number
          valid_from?: string
          valid_until?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['cashback_rates']['Insert']>
      }

      click_tracking: {
        Row: {
          id: string
          offer_id: string | null
          session_id: string | null
          user_agent: string | null
          ip_hash: string | null
          referer: string | null
          clicked_at: string
        }
        Insert: {
          id?: string
          offer_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          ip_hash?: string | null
          referer?: string | null
          clicked_at?: string
        }
        Update: Partial<Database['public']['Tables']['click_tracking']['Insert']>
      }

      user_profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          wallet_balance: number
          total_earned: number
          total_withdrawn: number
          referral_code: string | null
          referral_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          wallet_balance?: number
          total_earned?: number
          total_withdrawn?: number
          referral_code?: string | null
          referral_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }

      referral_clicks: {
        Row: {
          id: string
          referral_code: string
          user_id: string | null
          product_id: string | null
          platform: string | null
          offer_id: string | null
          ip_hash: string | null
          user_agent: string | null
          referer: string | null
          converted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referral_code: string
          user_id?: string | null
          product_id?: string | null
          platform?: string | null
          offer_id?: string | null
          ip_hash?: string | null
          user_agent?: string | null
          referer?: string | null
          converted?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['referral_clicks']['Insert']>
      }

      referral_commissions: {
        Row: {
          id: string
          user_id: string
          referral_click_id: string | null
          product_id: string | null
          platform: string | null
          amount_gross: number
          platform_rate: number
          user_rate: number
          user_amount: number
          owner_amount: number
          status: 'pending' | 'approved' | 'paid' | 'rejected'
          notes: string | null
          approved_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_click_id?: string | null
          product_id?: string | null
          platform?: string | null
          amount_gross: number
          platform_rate: number
          user_rate: number
          user_amount: number
          owner_amount: number
          status?: 'pending' | 'approved' | 'paid' | 'rejected'
          notes?: string | null
          approved_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['referral_commissions']['Insert']>
      }

      commission_settings: {
        Row: {
          id: string
          user_share_percent: number
          owner_share_percent: number
          min_payout: number
          notes: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_share_percent?: number
          owner_share_percent?: number
          min_payout?: number
          notes?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['commission_settings']['Insert']>
      }

      checkout_intents: {
        Row: {
          id: string
          product_id: string | null
          offer_id: string | null
          platform: string | null
          referral_code: string | null
          session_id: string | null
          ip_hash: string | null
          affiliate_url: string | null
          converted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id?: string | null
          offer_id?: string | null
          platform?: string | null
          referral_code?: string | null
          session_id?: string | null
          ip_hash?: string | null
          affiliate_url?: string | null
          converted?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['checkout_intents']['Insert']>
      }

      watchlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          target_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          target_price?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['watchlist']['Insert']>
      }
    }

    Views: {
      products_with_best_offer: {
        Row: {
          // product columns
          id: string
          name: string
          slug: string
          brand: string | null
          category: string | null
          subcategory: string | null
          description: string | null
          image_url: string | null
          images: string[]
          tags: string[]
          specifications: Json
          average_rating: number | null
          total_reviews: number
          created_at: string
          updated_at: string
          // aggregated offer columns
          best_price: number | null
          best_original_price: number | null
          best_merchant_id: string | null
          best_merchant_name: string | null
          best_platform_id: string | null
          best_merchant_color: string | null
          best_affiliate_url: string | null
          best_free_shipping: boolean | null
          offer_count: number
        }
      }
    }

    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ── Convenience aliases ────────────────────────────────────────────
export type MerchantRow           = Database['public']['Tables']['merchants']['Row']
export type ProductRow            = Database['public']['Tables']['products']['Row']
export type OfferRow              = Database['public']['Tables']['offers']['Row']
export type PriceHistoryRow       = Database['public']['Tables']['price_history']['Row']
export type CashbackRateRow       = Database['public']['Tables']['cashback_rates']['Row']
export type ClickTrackingRow      = Database['public']['Tables']['click_tracking']['Row']
export type UserProfileRow        = Database['public']['Tables']['user_profiles']['Row']
export type ReferralClickRow      = Database['public']['Tables']['referral_clicks']['Row']
export type ReferralCommissionRow = Database['public']['Tables']['referral_commissions']['Row']
export type CommissionSettingsRow = Database['public']['Tables']['commission_settings']['Row']
export type CheckoutIntentRow     = Database['public']['Tables']['checkout_intents']['Row']

// ── Joined / enriched types used in the app ───────────────────────
export interface OfferWithMerchant extends OfferRow {
  merchant: MerchantRow
}

export interface ProductWithOffers extends ProductRow {
  offers: OfferWithMerchant[]
}

export interface PriceHistoryPoint {
  date: string          // ISO string
  price: number
  platform_id: string
}
