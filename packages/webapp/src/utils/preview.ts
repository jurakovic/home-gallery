export const getPreviewSize = preview => {
  const prefix = 'image-preview-'
  const pos = preview.indexOf(prefix) + prefix.length
  const end = preview.indexOf('.', pos)
  if (end - pos < 1) {
    return 0
  }
  return +preview.substring(pos, end)
}

export const byPreviewSize = (a, b) => getPreviewSize(b) - getPreviewSize(a)

export const getLowerPreviewUrl = (previews, size) => {
  const preview = previews?.filter(preview => { const s = getPreviewSize(preview); return s > 0 && s <= size}).shift()
  if (!preview) {
    return false
  }
  return `files/${preview}`
}

export const getHigherPreviewUrl = (previews, size) => {
  const preview = previews?.filter(preview => getPreviewSize(preview) >= size).pop()
  if (!preview) {
    return getLowerPreviewUrl(previews, size)
  }
  return `files/${preview}`
}

export const getWidthFactor = (width, height) => width >= height ? 1 : height / (width || 1)

/**
 * Preview size which is required to fill a cell with a media of the given size.
 *
 * The thumbnails are rendered with `object-cover`: the media is scaled until it
 * covers the cell and the overlapping part is cropped. The preview size is the
 * longest edge of the preview, so the scaled longest edge of the media is
 * required.
 *
 * A squared cell needs a larger preview than a cell of the media aspect ratio:
 * the shorter media edge fills the cell and the longer edge is cropped
 */
export const getCoverPreviewSize = (cellWidth, cellHeight, mediaWidth, mediaHeight) => {
  if (!mediaWidth || !mediaHeight) {
    return cellWidth * getWidthFactor(cellWidth, cellHeight)
  }

  const scale = Math.max(cellWidth / mediaWidth, cellHeight / mediaHeight)
  return Math.max(mediaWidth, mediaHeight) * scale
}
