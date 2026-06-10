import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(url, anon)

export const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

export const DB = {
  PRODUCTS: 'copix_products',
  SETTINGS: 'copix_settings',
} as const

// Strip heavy bomTree from products before sending to Supabase
// bomTree is re-built from raw files — no need to store it in cloud
import type { ComputedProduct } from '@/types'

export function stripForCloud(products: ComputedProduct[]) {
  return products.map(p => ({
    category:          p.category,
    code:              p.code,
    name:              p.name,
    unit:              p.unit,
    netWeight:         p.netWeight,
    companyPrice:      p.companyPrice,
    costs:             p.costs,
    categoryDiscount:  p.categoryDiscount,
    netSalePrice:      p.netSalePrice,
    grossMarginRM:     p.grossMarginRM,
    grossMarginRMPct:  p.grossMarginRMPct,
    netProfit:         p.netProfit,
    netProfitPct:      p.netProfitPct,
    profitabilityClass: p.profitabilityClass,
    bomTree:           [],   // omit heavy tree — loaded from raw files
  }))
}
