import { useLayoutEffect, useRef, type SyntheticEvent } from 'react'

import { getPreviewSize } from './preview'

/**
 * Memory budget of the retained thumbnails.
 *
 * The cache holds the compressed preview files and not their decoded pixels, so
 * the budget buys a lot of thumbnails: it keeps about 3000 previews of the
 * usual thumbnail size of 320 pixels, which are several albums
 */
const cacheBytes = 64 * 1024 * 1024

/**
 * Estimated file size of a preview by the length of its longest edge.
 *
 * The previews are jpegs of a squared box which take about 0.2 bytes per pixel
 * at the quality of the extractor. The estimate is rough on purpose: the cache
 * only needs the magnitude of its entries to keep a large preview of the media
 * view from crowding out the thumbnails of a whole list
 */
const estimateBytes = (url: string) => {
  const size = getPreviewSize(url) || 320
  return size * size * 0.2
}

type TRetainedImage = {
  image: HTMLImageElement
  bytes: number
}

/**
 * Thumbnails which are held in the memory cache of the browser, ordered by
 * their last use. A Map keeps its insertion order, so the oldest url is its
 * first key
 */
const cache = new Map<string, TRetainedImage>()

let cachedBytes = 0

/**
 * Keeps a loaded thumbnail in the memory cache of the browser.
 *
 * The media list is unmounted with every query and its rows are unmounted while
 * they scroll out of the view, so their <img> elements are created again on the
 * next visit. The browser reads and decodes the file for the new element again,
 * which shows the list blank for a moment although every preview file is
 * cached. An Image of the same url holds the resource of the browser and lets
 * the new element paint from memory instead.
 *
 * It is called once the thumbnail of the cell is loaded, so the Image is served
 * by the cache of the browser and starts no request of its own. The oldest
 * thumbnails are dropped once the cache exceeds `cacheBytes`
 */
const retainImage = (url: string) => {
  const retained = cache.get(url)
  if (retained) {
    // the url is used again and becomes the newest entry of the cache
    cache.delete(url)
    cache.set(url, retained)
    return
  }

  const image = new Image()
  image.src = url
  const bytes = estimateBytes(url)
  cache.set(url, {image, bytes})
  cachedBytes += bytes

  while (cachedBytes > cacheBytes && cache.size > 1) {
    const [oldest, {bytes}] = cache.entries().next().value as [string, TRetainedImage]
    cache.delete(oldest)
    cachedBytes -= bytes
  }
}

/**
 * Transparent gif of a single pixel which fills a thumbnail until its preview
 * is loaded.
 *
 * An <img> without a src is unavailable for the browser, which draws its broken
 * image icon in the cell. The data url needs no request, is complete right away
 * and lets the vibrant color of the cell shine through
 */
const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Props of the <img> of a thumbnail.
 *
 * They keep the loaded preview in memory, see retainImage, and abort a pending
 * load when the cell is unmounted: a list scrolls over thousands of rows and
 * the browser keeps loading the preview of a removed row otherwise. The
 * requests of the flown rows queue up, delay the previews of the rows the user
 * stops at and go on long after the scroll ended.
 *
 * `skipLoad` holds the load back completely, which the lists use while they
 * scroll too fast to see a row. A thumbnail which is loaded already keeps its
 * url: it is painted and dropping it would blank the cell
 */
export const useThumbnailImage = (url: string | false, skipLoad: boolean = false) => {
  const ref = useRef<HTMLImageElement>(null)
  // the cells of a row are keyed by their column, so a cell is reused for
  // another media and its loaded url is compared instead of a loaded flag
  const loadedUrl = useRef<string | false>(false)

  useLayoutEffect(() => {
    // the element is captured, the ref itself can be cleared before the
    // cleanup of an unmounted cell runs
    const image = ref.current

    return () => {
      // an aborted load leaves no partial file in the cache of the browser, so
      // the preview is loaded completely on the next visit of the row
      if (image && !image.complete) {
        image.removeAttribute('src')
      }
    }
  }, [])

  const onLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    // the placeholder loads as well, only a loaded preview counts
    if (!url || event.currentTarget.getAttribute('src') != url) {
      return
    }
    loadedUrl.current = url
    retainImage(url)
  }

  // the placeholder starts no request, so a skipped or a missing preview costs
  // nothing but keeps the cell from drawing a broken image
  const src = url && (!skipLoad || loadedUrl.current == url) ? url : transparentPixel

  return {ref, src, onLoad}
}
