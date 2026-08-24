import { useSearchParams } from 'react-router-dom'

import { useAppConfig } from '../config/useAppConfig'
import { useFoldersStore, type TFolderView } from '../store/folders-store'
import { toThumbnailSize, type TThumbnailSize } from '../list/useThumbnailLayout'

/**
 * Search param of the folders page. The url is the source of truth so that a
 * view and an order can be shared. The value is always set explicitly,
 * otherwise a toggle would fall back to the configured value again
 */
const useFolderParam = (): [URLSearchParams, (key: string, value: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams()

  // other params of the page are kept
  const setParam = (key: string, value: string) => setSearchParams(params => {
    params.set(key, value)
    return params
  })

  return [searchParams, setParam]
}

/**
 * Drops the view and the order params of the folders page, so that the stored
 * and the configured values apply again. They win over the store, so a reset
 * of the view settings has to drop them
 */
export const useResetFolderParams = () => {
  const [, setSearchParams] = useSearchParams()

  return () => setSearchParams(params => {
    params.delete('view')
    params.delete('dir')
    return params
  })
}

/**
 * View of the folders page and its setter.
 *
 * The view of the user is kept until it is reset by a shared url. The config
 * sets the view of a user who did not pick one yet
 */
export const useFolderView = (): [boolean, (view: TFolderView) => void] => {
  const appConfig = useAppConfig()
  const [searchParams, setParam] = useFolderParam()
  const storeView = useFoldersStore(state => state.view)
  const setStoreView = useFoldersStore(state => state.setView)

  const configView: TFolderView = appConfig.pages?.folders?.view == 'grid' ? 'grid' : 'list'
  const isGrid = searchParams.has('view') ?
    searchParams.get('view') == 'grid' :
    (storeView || configView) == 'grid'

  const setView = (view: TFolderView) => {
    setStoreView(view)
    setParam('view', view)
  }

  return [isGrid, setView]
}

/**
 * Name order of the folders page and its setter. The config sets the initial
 * order only
 */
export const useFolderOrder = (): [boolean, (descending: boolean) => void] => {
  const appConfig = useAppConfig()
  const [searchParams, setParam] = useFolderParam()

  const descending = searchParams.has('dir') ?
    searchParams.get('dir') == 'desc' :
    appConfig.pages?.folders?.order == 'nameDesc'

  return [descending, (descending: boolean) => setParam('dir', descending ? 'desc' : 'asc')]
}

/**
 * Thumbnail size of the folders page. It is the size of the folder squares of
 * the grid view and the row height of the list view.
 *
 * The page keeps a size of its own, so that the folders and the media lists
 * can have different sizes
 */
export const useFolderThumbnailSize = (): TThumbnailSize => {
  const appConfig = useAppConfig()
  const sizeStep = useFoldersStore(state => state.sizeStep)
  const setSizeStep = useFoldersStore(state => state.setSizeStep)

  return toThumbnailSize(sizeStep, setSizeStep, appConfig.pages?.folders?.thumbnailSize)
}
