import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TFolderView = 'list' | 'grid'

export interface FoldersStore {
  /**
   * Folder view of the user. It is empty as long as the user did not toggle
   * the view, than the configured view is used
   */
  view: TFolderView | ''
  setView: (view: TFolderView) => void
  /**
   * Thumbnail size of the user as step around the default size. It is empty as
   * long as the user did not change the size, than the configured size is used
   */
  sizeStep: number | ''
  setSizeStep: (sizeStep: number) => void
}

export const useFoldersStore = create<
  FoldersStore,
  [
    ["zustand/persist", FoldersStore]
  ]
  >(
  persist((set) => ({
    view: '',

    setView: (view: TFolderView) => {
      set((state) => ({...state, view}))
    },

    sizeStep: '',

    setSizeStep: (sizeStep: number) => {
      set((state) => ({...state, sizeStep}))
    },
  }), { name: 'gallery-folders' })
)
