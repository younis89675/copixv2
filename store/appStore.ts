import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ComputedProduct, AppSettings, RawProduct, BOMLine, PriceItem } from '@/types'
import { DEFAULT_SETTINGS } from '@/lib/costingEngine'
import { supabase, DB, isSupabaseConfigured, stripForCloud } from '@/lib/supabase'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface AppStore {
  rawProducts:      RawProduct[]
  bomLines:         BOMLine[]
  prices:           PriceItem[]
  computedProducts: ComputedProduct[]
  isLoaded:         boolean
  settings:         AppSettings
  syncStatus:       SyncStatus
  lastSyncAt:       string | null

  setRawData:          (p: RawProduct[], b: BOMLine[], pr: PriceItem[]) => void
  setComputedProducts: (products: ComputedProduct[]) => void
  updateSettings:      (s: Partial<AppSettings>) => void
  reset:               () => void
  setSyncStatus:       (s: SyncStatus) => void
  pushToCloud:         () => Promise<void>
  pullFromCloud:       () => Promise<void>
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      rawProducts:      [],
      bomLines:         [],
      prices:           [],
      computedProducts: [],
      isLoaded:         false,
      settings:         DEFAULT_SETTINGS,
      syncStatus:       'idle',
      lastSyncAt:       null,

      setSyncStatus: (syncStatus) => set({ syncStatus }),

      setRawData: (rawProducts, bomLines, prices) =>
        set({ rawProducts, bomLines, prices }),

      setComputedProducts: (computedProducts) =>
        set({ computedProducts, isLoaded: true }),

      // Just update state — caller is responsible for recalculate + push
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      reset: () => set({
        rawProducts: [], bomLines: [], prices: [],
        computedProducts: [], isLoaded: false,
        syncStatus: 'idle', lastSyncAt: null,
      }),

      // ── Push to Supabase ──────────────────────────────────────
      pushToCloud: async () => {
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not configured — skipping push')
          return
        }
        const { computedProducts, settings } = get()
        if (!computedProducts.length) return

        set({ syncStatus: 'syncing' })
        try {
          // Strip heavy bomTree to keep payload under Supabase 5MB limit
          const slim = stripForCloud(computedProducts)

          const { error: e1 } = await supabase
            .from(DB.PRODUCTS)
            .upsert({ id: 'main', payload: slim, version: Date.now() })
          if (e1) throw e1

          const { error: e2 } = await supabase
            .from(DB.SETTINGS)
            .upsert({ id: 'main', payload: settings })
          if (e2) throw e2

          set({ syncStatus: 'synced', lastSyncAt: new Date().toISOString() })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : JSON.stringify(err)
          console.error('Supabase push failed:', msg)
          set({ syncStatus: 'error' })
        }
      },

      // ── Pull from Supabase ────────────────────────────────────
      pullFromCloud: async () => {
        if (!isSupabaseConfigured()) return
        set({ syncStatus: 'syncing' })
        try {
          const [{ data: pd, error: e1 }, { data: sd, error: e2 }] = await Promise.all([
            supabase.from(DB.PRODUCTS).select('payload').eq('id', 'main').single(),
            supabase.from(DB.SETTINGS).select('payload').eq('id', 'main').single(),
          ])
          if (e1 && e1.code !== 'PGRST116') throw e1
          if (e2 && e2.code !== 'PGRST116') throw e2

          if (pd?.payload) set({ computedProducts: pd.payload as ComputedProduct[], isLoaded: true })
          if (sd?.payload) set({ settings: sd.payload as AppSettings })

          set({ syncStatus: 'synced', lastSyncAt: new Date().toISOString() })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : JSON.stringify(err)
          console.error('Supabase pull failed:', msg)
          set({ syncStatus: 'error' })
        }
      },
    }),
    {
      name: 'copix-store-v3',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
