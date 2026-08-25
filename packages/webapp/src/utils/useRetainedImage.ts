import { useEffect } from 'react'

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
 * Keeps a thumbnail in the memory cache of the browser.
 *
 * The media list is unmounted with every query and its rows are unmounted while
 * they scroll out of the view, so their <img> elements are created again on the
 * next visit. The browser reads and decodes the file for the new element again,
 * which shows the list blank for a moment although every file is cached.
 *
 * An Image of the same url holds the resource of the browser and lets the new
 * element paint from memory instead. The oldest thumbnails are dropped once the
 * cache exceeds `cacheBytes`
 */
export const retainImage = (url: string) => {
  const retained = cache.get(url)
  if (retained) {
    // the url is used again and becomes the newest entry of the cache
    cache.delete(url)
    cache.set(url, retained)
    return
  }

  // the load is served by the element of the list, this Image only holds it
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

/** Holds the thumbnail of a cell as long as it is in the cache, see retainImage */
export const useRetainedImage = (url: string | false) => {
  useEffect(() => {
    if (url) {
      retainImage(url)
    }
  }, [url])
}
