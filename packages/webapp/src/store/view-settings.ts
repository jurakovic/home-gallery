import { useAlbumsStore } from './albums-store'
import { useListLayoutStore } from './list-layout-store'
import { useSingleViewStore } from './single-view-store'

/**
 * Drops every view setting which the user changed, so that the values of
 * `webapp.pages` apply again.
 *
 * The search query and the selection of the edit mode are no view settings and
 * are kept. The order of a media list is part of its query, too
 */
export const resetViewSettings = () => {
  useListLayoutStore.getState().reset()
  useAlbumsStore.getState().reset()
  useSingleViewStore.getState().reset()
}
