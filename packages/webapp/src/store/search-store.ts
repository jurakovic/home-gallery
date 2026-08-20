import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Search {
  type: 'none' | 'year' | 'query' | 'similar' | 'faces'
  value?: any
  query?: string
}

/**
 * True if both queries select the same media. Every list view sets its query
 * from the url on each mount, also when the media view returns to its list. An
 * equal query keeps the current entries and the scroll position of the list
 */
const isSameQuery = (a: Search, b: Search) => a.type == b.type &&
  (a.query || '') == (b.query || '') &&
  JSON.stringify(a.value ?? null) == JSON.stringify(b.value ?? null)

export interface SearchStore {
  query: Search
  search: (query: Search) => void
}

export const useSearchStore = create<
  SearchStore,
  [
    ["zustand/persist", SearchStore]
  ]
  >(
  persist((set, get) => ({
    query: { type: 'none' },

    search: (query: Search) => {
      set((state) => isSameQuery(state.query, query) ? state : {...state, query})
    },
  }), { name: 'gallery-search' })
)

