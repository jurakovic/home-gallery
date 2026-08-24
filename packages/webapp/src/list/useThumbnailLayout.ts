import { useAppConfig } from '../config/useAppConfig'
import { useListLayoutStore, type TThumbnailLayout } from '../store/list-layout-store'

const defaultLayout: TThumbnailLayout = 'fluent'

/** Layouts in the order of the settings panel */
export const thumbnailLayouts: TThumbnailLayout[] = ['fluent', 'grid', 'list']

const toLayout = (value?: string): TThumbnailLayout =>
  thumbnailLayouts.find(layout => layout == value) || defaultLayout

/**
 * Thumbnail layout of the media lists and its setter.
 *
 * The layout of the config is the initial one. It is overruled as soon as the
 * user picks a layout
 */
export const useThumbnailLayout = (): [TThumbnailLayout, (layout: TThumbnailLayout) => void] => {
  const appConfig = useAppConfig()
  const layout = useListLayoutStore(state => state.layout)
  const setLayout = useListLayoutStore(state => state.setLayout)

  const current = layout || toLayout(appConfig.pages?.list?.thumbnails)

  return [current, setLayout]
}

/**
 * Size factors of the thumbnail size steps. The step is the index offset to
 * the default size factor of 1
 */
const sizeFactors = [0.65, 0.8, 1, 1.25, 1.5]

export const minSizeStep = -2
export const maxSizeStep = sizeFactors.length + minSizeStep - 1

const configSizeSteps = {
  xsmall: -2,
  small: -1,
  medium: 0,
  large: 1,
  xlarge: 2,
}

const clampSizeStep = (step: number) => Math.min(maxSizeStep, Math.max(minSizeStep, step))

/** Names of the size steps in the order of the size factors */
const sizeStepNames = ['XSmall', 'Small', 'Medium', 'Large', 'XLarge']

/** Name of a size step as it is shown in the settings panel */
export const toSizeStepName = (step: number) => sizeStepNames[step - minSizeStep] || ''

/** Thumbnail size as step, its size factor and the setter of the step */
export type TThumbnailSize = [number, number, (step: number) => void]

/**
 * Thumbnail size of a size step of a store and a configured size. The size of
 * the config is the initial one. It is overruled as soon as the user changes
 * the size.
 *
 * The pages keep their own size, so a size hook is required per page
 */
export const toThumbnailSize = (sizeStep: number | '', setSizeStep: (step: number) => void, configSize?: string): TThumbnailSize => {
  const configStep = configSizeSteps[configSize || 'medium'] ?? 0
  const current = clampSizeStep(sizeStep === '' ? configStep : sizeStep)

  return [current, sizeFactors[current - minSizeStep], (step: number) => setSizeStep(clampSizeStep(step))]
}

/**
 * Thumbnail size of the media lists as step around the default size. The
 * returned factor scales the cell size of the grid layout, the row heights
 * of the fluent layout and the rows of the list layout
 */
export const useThumbnailSize = (): TThumbnailSize => {
  const appConfig = useAppConfig()
  const sizeStep = useListLayoutStore(state => state.sizeStep)
  const setSizeStep = useListLayoutStore(state => state.setSizeStep)

  return toThumbnailSize(sizeStep, setSizeStep, appConfig.pages?.list?.thumbnailSize)
}
