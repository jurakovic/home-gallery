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
  /**
   * Thumbnail size of the user as step around the default size. It is empty as
   * long as the user did not change the size, than the configured size is used
   */
  sizeStep: number | ''
  setSizeStep: (sizeStep: number) => void
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

    sizeStep: '',

    setSizeStep: (sizeStep: number) => {
      set((state) => ({...state, sizeStep}))
    },
  }), { name: 'gallery-list-layout' })
)
