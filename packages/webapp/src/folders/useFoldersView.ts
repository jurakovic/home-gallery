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
 * View of the folders page and its toggle.
 *
 * The view of the user is kept until it is reset by a shared url. The config
 * sets the view of a user who did not toggle it yet
 */
export const useFolderView = (): [boolean, () => void] => {
  const appConfig = useAppConfig()
  const [searchParams, setParam] = useFolderParam()
  const storeView = useFoldersStore(state => state.view)
  const setStoreView = useFoldersStore(state => state.setView)

  const configView: TFolderView = appConfig.pages?.folders?.view == 'grid' ? 'grid' : 'list'
  const isGrid = searchParams.has('view') ?
    searchParams.get('view') == 'grid' :
    (storeView || configView) == 'grid'

  const toggleView = () => {
    const view: TFolderView = isGrid ? 'list' : 'grid'
    setStoreView(view)
    setParam('view', view)
  }

  return [isGrid, toggleView]
}

/**
 * Name order of the folders page and its toggle. The config sets the initial
 * order only
 */
export const useFolderOrder = (): [boolean, () => void] => {
  const appConfig = useAppConfig()
  const [searchParams, setParam] = useFolderParam()

  const descending = searchParams.has('dir') ?
    searchParams.get('dir') == 'desc' :
    appConfig.pages?.folders?.order == 'nameDesc'

  return [descending, () => setParam('dir', descending ? 'asc' : 'desc')]
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
