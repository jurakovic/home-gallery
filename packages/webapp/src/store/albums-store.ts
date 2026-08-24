import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TAlbumView = 'list' | 'grid'

export interface AlbumsStore {
  /**
   * Album view of the user. It is empty as long as the user did not toggle
   * the view, than the configured view is used
   */
  view: TAlbumView | ''
  setView: (view: TAlbumView) => void
  /**
   * Thumbnail size of the user as step around the default size. It is empty as
   * long as the user did not change the size, than the configured size is used
   */
  sizeStep: number | ''
  setSizeStep: (sizeStep: number) => void
  /** Drops the values of the user, so that the configured ones apply again */
  reset: () => void
}

export const useAlbumsStore = create<
  AlbumsStore,
  [
    ["zustand/persist", AlbumsStore]
  ]
  >(
  persist((set) => ({
    view: '',

    setView: (view: TAlbumView) => {
      set((state) => ({...state, view}))
    },

    sizeStep: '',

    setSizeStep: (sizeStep: number) => {
      set((state) => ({...state, sizeStep}))
    },

    reset: () => {
      set((state) => ({...state, view: '', sizeStep: ''}))
    },
  }), { name: 'gallery-albums' })
)
