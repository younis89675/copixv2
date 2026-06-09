import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SavedQuotation } from '@/types'

interface QuotationStore {
  savedQuotations: SavedQuotation[]
  saveQuotation:   (q: SavedQuotation) => void
  deleteQuotation: (id: string) => void
  updateQuotation: (q: SavedQuotation) => void
}

export const useQuotationStore = create<QuotationStore>()(
  persist(
    (set) => ({
      savedQuotations: [],
      saveQuotation: (q) =>
        set((s) => ({ savedQuotations: [q, ...s.savedQuotations] })),
      deleteQuotation: (id) =>
        set((s) => ({ savedQuotations: s.savedQuotations.filter((q) => q.id !== id) })),
      updateQuotation: (q) =>
        set((s) => ({ savedQuotations: s.savedQuotations.map((x) => x.id === q.id ? q : x) })),
    }),
    { name: 'copix-quotations-v1' }
  )
)
