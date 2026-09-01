import * as React from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavBar } from '../navbar/NavBar';
import { useEntryStore } from '../store/entry-store';
import { buildTree, flattenTree, type TreeNode } from './buildTree';
import { toAlbumQuery } from './toAlbumQuery';
import { useAlbumOrder, useAlbumThumbnailSize, useAlbumView } from './useAlbumsView';
import { useAppConfig } from '../config/useAppConfig';
import { getCoverPreviewSize, getHigherPreviewUrl } from '../utils/preview';
import { useDeviceType, DeviceType } from '../utils/useDeviceType';
import useBodyDimensions from '../utils/useBodyDimensions';
import { useScrollToTop } from '../utils/useScrollToTop';
import { useThumbnailImage } from '../utils/useThumbnailImage';
import { VirtualScroll, isFastScroll } from '../list/VirtualScroll';
import { desktopGridSize, grid, mobileGridSize } from '../list/layout/grid';
import { desktopRowHeight, list, mobileRowHeight } from '../list/layout/list';

type ExpandedMap = {[key: string]: boolean}

/** Album of the list view with its depth in the album tree */
type TAlbumItem = {node: TreeNode, level: number}

/** Empty tree while the initial database load is still pending */
const emptyRoot = buildTree([])

/**
 * Space between the album cells and the rows. It is the padding of the media
 * lists, so both pages are spaced alike
 */
const padding = 8

/**
 * Height of the album name below its cover thumbnail in the grid view. It is
 * the pt-1 padding and two lines of the text-xs label, which has a line height
 * of 16px.
 *
 * The rows are layouted before they are rendered, so the label needs a fixed
 * height. Two lines hold the paths of the usual album depths, a longer one is
 * clipped and stays readable in the title of the label
 */
const nameLabelHeight = 4 + 2 * 16

/** Cover url of an album or false if it has no cover or covers are disabled */
const getCoverUrl = (node: TreeNode, showCover: boolean, width: number, height: number) => {
  if (!showCover) {
    return false
  }

  // the cover is cropped to the cell by object-cover, like the media thumbnails
  const size = getCoverPreviewSize(width, height, node.cover?.width, node.cover?.height)
  return getHigherPreviewUrl(node.cover?.previews, size * (window.devicePixelRatio || 1))
}

/** Fallback icon of an album without a cover media */
const getAlbumIcon = (node: TreeNode, isExpanded: boolean = false) => {
  // the index is only shown with the showIndex option, otherwise every node has a path
  if (!node.path) {
    return icons.faDatabase
  }
  return isExpanded ? icons.faFolderOpen : icons.faFolder
}

/** Title of the media count of an album */
const countTitle = 'Media of the album and its sub-albums'

/**
 * Media count of an album as a badge of its cover thumbnail. It is the badge
 * of the media lists, which carry the duration of a video
 */
const CountBadge = ({count}: {count: number}) => (
  <span className="absolute px-1 text-xs text-gray-100 rounded bottom-1 right-1 bg-gray-900/70 group-hover:bg-gray-900"
    title={countTitle}>
    {count}
  </span>
)

/**
 * Name of an album below its cover thumbnail. It has the styling of the file
 * name label of the media lists, but wraps at word boundaries instead of being
 * truncated: the grid has no hierarchy and shows the whole path, whose last
 * part names the album and would be the first to be cut off.
 *
 * The label keeps the height of `nameLabelHeight`, so a name of more than two
 * lines is clipped at a full line
 */
const NameLabel = ({name}: {name: string}) => (
  <span className="flex-shrink-0 pt-1 overflow-hidden text-xs text-gray-500 break-words group-hover:text-gray-300"
    style={{height: nameLabelHeight}}
    title={name}>
    {name}
  </span>
)

/**
 * Row of an album in the list view. It has the shape of a row of the media
 * list layout: the cover thumbnail with the media count as its badge and the
 * album name
 */
const AlbumItem = ({node, level, showCover, rowHeight, scrollSpeed, expanded, toggle}: {node: TreeNode, level: number, showCover: boolean, rowHeight: number, scrollSpeed: number, expanded: ExpandedMap, toggle: (key: string) => void}) => {
  const isExpandable = node.children.length > 0
  const isExpanded = isExpandable && !!expanded[node.key]
  const query = toAlbumQuery(node)
  const icon = getAlbumIcon(node, isExpanded)
  const coverUrl = getCoverUrl(node, showCover, rowHeight, rowHeight)
  const name = node.name || '(no index)'

  // the row is unmounted while it scrolls out of the view, so its cover is kept
  // in the memory of the browser for the next visit and a pending load is
  // aborted with the row, see useThumbnailImage
  const imageProps = useThumbnailImage(coverUrl, isFastScroll(scrollSpeed))

  return (
    <span className="flex items-center min-w-0 rounded grow group hover:bg-gray-700" style={{paddingLeft: `${level}rem`, height: rowHeight}}>
      { isExpandable &&
        // the expand box is the only space left of the thumbnail
        <a className="flex items-center justify-center flex-shrink-0 w-8 h-full text-gray-500 rounded hover:bg-gray-600 hover:text-gray-300 hover:cursor-pointer"
          onClick={() => toggle(node.key)}
          title={isExpanded ? 'Collapse album' : 'Expand album'}>
          <FontAwesomeIcon icon={isExpanded ? icons.faAngleDown : icons.faAngleRight} />
        </a>
      }
      <Link className="flex items-center h-full min-w-0 gap-4 text-gray-500 grow group-hover:text-gray-300 hover:cursor-pointer"
        to={`/search/${encodeURIComponent(query)}`}
        title={`Search for '${query}'`}>
        {/* the box keeps the row height of albums without a cover media */}
        <span className="relative flex items-center justify-center flex-shrink-0 h-full rounded bg-gray-800" style={{width: rowHeight}}>
          { coverUrl ?
            <img {...imageProps} className="object-cover w-full h-full rounded" alt="" /> :
            <FontAwesomeIcon icon={icon} />
          }
          <CountBadge count={node.count} />
        </span>
        <span className="text-sm text-gray-400 truncate md:text-base grow group-hover:text-gray-300" title={name}>
          {name}
        </span>
      </Link>
    </span>
  )
}

/**
 * Squared cell of an album in the grid view.
 *
 * The grid has no album hierarchy, so the whole path of the album is shown
 * instead of its name only
 */
const AlbumCard = ({node, showCover, cellSize, scrollSpeed}: {node: TreeNode, showCover: boolean, cellSize: number, scrollSpeed: number}) => {
  const query = toAlbumQuery(node)
  const coverUrl = getCoverUrl(node, showCover, cellSize, cellSize)
  const name = node.path || node.name || '(no index)'

  const imageProps = useThumbnailImage(coverUrl, isFastScroll(scrollSpeed))

  return (
    <Link className="flex flex-col flex-shrink-0 min-w-0 text-gray-500 group hover:cursor-pointer"
      style={{width: cellSize, height: cellSize + nameLabelHeight}}
      to={`/search/${encodeURIComponent(query)}`}
      title={`Search for '${query}'`}>
      <span className="relative flex items-center justify-center overflow-hidden rounded bg-gray-800 group-hover:bg-gray-700"
        style={{width: cellSize, height: cellSize}}>
        { coverUrl ?
          <img {...imageProps} className="object-cover w-full h-full" alt="" /> :
          <FontAwesomeIcon className="text-2xl" icon={getAlbumIcon(node)} />
        }
        <CountBadge count={node.count} />
      </span>
      <NameLabel name={name} />
    </Link>
  )
}

/**
 * Row of the album page. It has the shape of a row of the media lists: the
 * grid row holds one cell per column, the list row a single cell of the full
 * width. The row is padded by half the gap, so the space around the cells is
 * one gap
 */
const AlbumRow = ({row, isGrid, showCover, scrollSpeed, expanded, toggle}: {row: any, isGrid: boolean, showCover: boolean, scrollSpeed: number, expanded: ExpandedMap, toggle: (key: string) => void}) => (
  <div className="flex items-center w-full" style={{gap: padding, padding: padding / 2, height: row.height}}>
    { row.columns.map((cell: any) => isGrid ?
      <AlbumCard key={cell.item.key} node={cell.item} showCover={showCover} cellSize={cell.width} scrollSpeed={scrollSpeed} /> :
      <AlbumItem key={cell.item.node.key} node={cell.item.node} level={cell.item.level}
        showCover={showCover} rowHeight={cell.height} scrollSpeed={scrollSpeed} expanded={expanded} toggle={toggle} />
    )}
  </div>
)

/**
 * Albums of the list view in their display order: an expanded album is
 * directly followed by its sub-albums, a collapsed one hides them. The virtual
 * scroll renders a flat list of rows, so the tree is flattened here
 */
const flattenVisible = (node: TreeNode, expanded: ExpandedMap, level: number = 0): TAlbumItem[] =>
  node.children.flatMap(child => [
    {node: child, level},
    ...(expanded[child.key] ? flattenVisible(child, expanded, level + 1) : [])
  ])

export const Albums = () => {
  // the page is opened from a scrolled media list and starts at its first album
  useScrollToTop()

  const allEntries = useEntryStore(state => state.allEntries);
  const initialLoadDone = useEntryStore(state => state.initialLoadDone);
  const appConfig = useAppConfig()
  const showIndex = !!appConfig.pages?.albums?.showIndex
  const showCover = appConfig.pages?.albums?.showCover ?? true

  // the view and the order are toggled in the nav bar
  const [isGrid] = useAlbumView()
  const [descending] = useAlbumOrder()

  // The database is loaded in chunks and the entries of the initial page are
  // only the newest media. Their tree shows a few albums for a moment and is
  // replaced by the full tree once the database is loaded, see useLoadDatabase
  const root = useMemo(() => initialLoadDone ? buildTree(allEntries, showIndex, descending) : emptyRoot, [allEntries, initialLoadDone, showIndex, descending]);

  // the squares and the rows are scaled by the thumbnail size of the page
  const [ , sizeFactor ] = useAlbumThumbnailSize()
  const [ deviceType ] = useDeviceType()
  const { width } = useBodyDimensions()
  const isMobile = deviceType === DeviceType.MOBILE
  const cellSize = Math.round((isMobile ? mobileGridSize : desktopGridSize) * sizeFactor)
  const rowHeight = Math.round((isMobile ? mobileRowHeight : desktopRowHeight) * sizeFactor)

  const [expanded, setExpanded] = useState<ExpandedMap>({})

  const toggle = (key: string) => setExpanded(expanded => ({...expanded, [key]: !expanded[key]}))

  // A library holds an album per media directory, so both views are rendered
  // by the virtual scroll of the media lists. They share its row layouts, so
  // the album grid gets the columns and the cell size of the media grid
  const rows = useMemo(() => {
    if (isGrid) {
      // the grid has no hierarchy and lists the albums of all tree levels
      return grid(flattenTree(root), {width, padding, minSize: cellSize, labelHeight: nameLabelHeight})
    }
    return list(flattenVisible(root, expanded), {padding, rowHeight})
  }, [root, isGrid, expanded, width, cellSize, rowHeight])

  return (
    <>
      <NavBar disableEdit={true} showAlbums={true} />
      { !initialLoadDone &&
        <p className="m-4 text-gray-500">Loading albums ...</p>
      }
      { initialLoadDone && !root.children.length &&
        <p className="m-4 text-gray-500">No media found</p>
      }
      <div className="relative z-0 w-full">
        <VirtualScroll items={rows} padding={padding}>
          {({row, scrollSpeed}) => (
            <AlbumRow row={row} isGrid={isGrid} showCover={showCover} scrollSpeed={scrollSpeed} expanded={expanded} toggle={toggle} />
          )}
        </VirtualScroll>
      </div>
    </>
  )
}
