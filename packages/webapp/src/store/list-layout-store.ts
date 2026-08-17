import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TThumbnailLayout = 'fluent' | 'square'

export interface ListLayoutStore {
  /**
   * Thumbnail layout of the user. It is empty as long as the user did not
   * toggle the layout, than the configured layout is used
   */
  layout: TThumbnailLayout | ''
  setLayout: (layout: TThumbnailLayout) => void
}

export const useListLayoutStore = create<
  ListLayoutStore,
  [
    ["zustand/persist", ListLayoutStore]
  ]
  >(
  persist((set) => ({
    layout: '',

    setLayout: (layout: TThumbnailLayout) => {
      set((state) => ({...state, layout}))
    },
  }), { name: 'gallery-list-layout' })
)
