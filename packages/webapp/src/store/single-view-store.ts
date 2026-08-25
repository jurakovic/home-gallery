import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SingleViewStore {
  lastId: string
  lastIndex: number
  /**
   * Media whose media view was opened from the list and the scroll position of
   * the list at that moment. The media view fills the view and shrinks the
   * page, so the browser drops the position of the list and it is restored on
   * the way back to the same media, see FluentList
   */
  listScrollId: string
  listScrollTop: number
  showDetails: boolean
  showAnnotations: boolean
  showNavigation: boolean

  setLastId(lastId: string): void
  setLastIndex(lastIndex: number): void
  setListScroll(listScrollId: string, listScrollTop: number): void
  setShowDetails(show: boolean): void
  setShowAnnotations(show: boolean): void
  setShowNavigation(show: boolean): void
  /** Drops the values of the user. The last media of the list is kept */
  reset(): void
}

/** Defaults of the values which the user toggles in the media view */
const defaultView = {
  showDetails: false,
  showAnnotations: false,
  showNavigation: true,
}

const excludeStateProps = (excludeProps: string[] = []) => (state: any): any => Object.fromEntries(
  Object.entries(state).filter(([key]) => !excludeProps.includes(key)))

export const useSingleViewStore = create<
  SingleViewStore,
  [
    ["zustand/persist", SingleViewStore]
  ]
>(
  persist((set) => ({
  lastId: '',
  lastIndex: -1,
  listScrollId: '',
  listScrollTop: -1,
  ...defaultView,

  setLastId: (lastId: string) => set((state: SingleViewStore) => ({...state, lastId})),
  setLastIndex: (lastIndex: number) => set((state: SingleViewStore) => ({...state, lastIndex})),
  setListScroll: (listScrollId: string, listScrollTop: number) => set((state: SingleViewStore) => ({...state, listScrollId, listScrollTop})),
  setShowDetails: (show: boolean) => set((state: SingleViewStore) => ({...state, showDetails: show})),
  setShowAnnotations: (show: boolean) => set((state: SingleViewStore) => ({...state, showAnnotations: show})),
  setShowNavigation: (show: boolean) => set((state: SingleViewStore) => ({...state, showNavigation: show})),
  reset: () => set((state: SingleViewStore) => ({...state, ...defaultView})),
}), {
  name: 'gallery-single-view',
  partialize: excludeStateProps(['lastId', 'lastIndex', 'listScrollId', 'listScrollTop']),
}))
