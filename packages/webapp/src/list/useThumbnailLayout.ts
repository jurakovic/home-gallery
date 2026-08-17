import { useAppConfig } from '../config/useAppConfig'
import { useListLayoutStore, type TThumbnailLayout } from '../store/list-layout-store'

const defaultLayout: TThumbnailLayout = 'fluent'

/**
 * Thumbnail layout of the media lists.
 *
 * The layout of the config is the initial one. It is overruled as soon as the
 * user toggles the layout
 */
export const useThumbnailLayout = (): [TThumbnailLayout, () => void] => {
  const appConfig = useAppConfig()
  const layout = useListLayoutStore(state => state.layout)
  const setLayout = useListLayoutStore(state => state.setLayout)

  const configLayout = appConfig.pages?.list?.thumbnails == 'square' ? 'square' : defaultLayout
  const current = layout || configLayout

  return [current, () => setLayout(current == 'square' ? 'fluent' : 'square')]
}
