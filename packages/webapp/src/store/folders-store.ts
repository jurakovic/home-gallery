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
  }), { name: 'gallery-folders' })
)
