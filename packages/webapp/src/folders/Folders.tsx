import * as React from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavBar } from '../navbar/NavBar';
import { useEntryStore } from '../store/entry-store';
import { buildTree, flattenTree, type TreeNode } from './buildTree';
import { toFolderQuery } from './toFolderQuery';
import { useFolderOrder, useFolderThumbnailSize, useFolderView } from './useFoldersView';
import { useAppConfig } from '../config/useAppConfig';
import { getHigherPreviewUrl } from '../utils/preview';
import { useDeviceType, DeviceType } from '../utils/useDeviceType';
import { desktopRowHeight, mobileRowHeight } from '../list/list';

type ExpandedMap = {[key: string]: boolean}

/** Empty tree while the initial database load is still pending */
const emptyRoot = buildTree([])

/**
 * Minimum edge length of a folder square at the default thumbnail size. It is
 * scaled by the size factor of the thumbnail size. The mobile size is smaller
 * than the cell size of the media lists so that three folders fit in a row
 */
const mobileCellSize = 100
const desktopCellSize = 180

/** Cover url of a folder or false if it has no cover or covers are disabled */
const getCoverUrl = (node: TreeNode, showCover: boolean, size: number) =>
  showCover ? getHigherPreviewUrl(node.cover?.previews, size * (window.devicePixelRatio || 1)) : false

/** Fallback icon of a folder without a cover media */
const getFolderIcon = (node: TreeNode, isExpanded: boolean = false) => {
  // the index is only shown with the showIndex option, otherwise every node has a path
  if (!node.path) {
    return icons.faDatabase
  }
  return isExpanded ? icons.faFolderOpen : icons.faFolder
}

/** Title of the media count of a folder */
const countTitle = 'Media of the folder and its subfolders'

/**
 * Row of a folder in the list view. It has the shape of a row of the media
 * list layout: the cover thumbnail with the media count as its badge and the
 * folder name
 */
const FolderItem = ({node, level, showCover, rowHeight, expanded, toggle}: {node: TreeNode, level: number, showCover: boolean, rowHeight: number, expanded: ExpandedMap, toggle: (key: string) => void}) => {
  const isExpandable = node.children.length > 0
  const isExpanded = isExpandable && !!expanded[node.key]
  const query = toFolderQuery(node)
  const icon = getFolderIcon(node, isExpanded)
  const coverUrl = getCoverUrl(node, showCover, rowHeight)

  return (
    <>
      <li>
        <span className="flex items-center rounded group hover:bg-gray-700" style={{paddingLeft: `${level}rem`, height: rowHeight}}>
          { isExpandable &&
            // the expand box is the only space left of the thumbnail
            <a className="flex items-center justify-center flex-shrink-0 w-8 h-full text-gray-500 rounded hover:bg-gray-600 hover:text-gray-300 hover:cursor-pointer"
              onClick={() => toggle(node.key)}
              title={isExpanded ? 'Collapse folder' : 'Expand folder'}>
              <FontAwesomeIcon icon={isExpanded ? icons.faAngleDown : icons.faAngleRight} />
            </a>
          }
          <Link className="flex items-center h-full min-w-0 gap-4 text-gray-500 grow group-hover:text-gray-300 hover:cursor-pointer"
            to={`/search/${encodeURIComponent(query)}`}
            title={`Search for '${query}'`}>
            { showCover ?
              // the box keeps the row height of folders without a cover media
              <span className="relative flex items-center justify-center flex-shrink-0 h-full rounded bg-gray-800" style={{width: rowHeight}}>
                { coverUrl ?
                  <img className="object-cover w-full h-full rounded" src={coverUrl} alt="" loading="lazy" /> :
                  <FontAwesomeIcon icon={icon} />
                }
                {/* the count is a badge of the thumbnail like the duration of a video */}
                <span className="absolute px-1 text-xs text-gray-100 rounded bottom-1 right-1 bg-gray-900/70 group-hover:bg-gray-900"
                  title={countTitle}>
                  {node.count}
                </span>
              </span> :
              <FontAwesomeIcon className="flex-shrink-0" icon={icon} />
            }
            <span className="text-sm truncate md:text-base grow">
              {node.name || '(no index)'}
              { !showCover &&
                // the count has no thumbnail to be a badge of
                <span className="whitespace-nowrap" title={countTitle}> ({node.count})</span>
              }
            </span>
          </Link>
        </span>
      </li>
      { isExpanded && node.children.map(child => (
        <FolderItem key={child.key} node={child} level={level + 1} showCover={showCover} rowHeight={rowHeight} expanded={expanded} toggle={toggle} />
      ))}
    </>
  )
}

/**
 * Squared cell of a folder in the grid view.
 *
 * The grid has no folder hierarchy, so the whole path of the folder is shown
 * instead of its name only
 */
const FolderCard = ({node, showCover, cellSize}: {node: TreeNode, showCover: boolean, cellSize: number}) => {
  const query = toFolderQuery(node)
  const coverUrl = getCoverUrl(node, showCover, cellSize)

  return (
    <li className="min-w-0">
      <Link className="group flex flex-col gap-2 text-gray-500 hover:text-gray-300 hover:cursor-pointer"
        to={`/search/${encodeURIComponent(query)}`}
        title={`Search for '${query}'`}>
        <span className="flex items-center justify-center w-full overflow-hidden rounded aspect-square bg-gray-800 group-hover:bg-gray-700">
          { coverUrl ?
            <img className="object-cover w-full h-full" src={coverUrl} alt="" loading="lazy" /> :
            <FontAwesomeIcon className="text-2xl" icon={getFolderIcon(node)} />
          }
        </span>
        <span className="min-w-0 text-sm break-words">{node.path || node.name || '(no index)'} <span className="whitespace-nowrap">({node.count})</span></span>
      </Link>
    </li>
  )
}

export const Folders = () => {
  const allEntries = useEntryStore(state => state.allEntries);
  const initialLoadDone = useEntryStore(state => state.initialLoadDone);
  const appConfig = useAppConfig()
  const showIndex = !!appConfig.pages?.folders?.showIndex
  const showCover = appConfig.pages?.folders?.showCover ?? true

  // the view and the order are toggled in the nav bar
  const [isGrid] = useFolderView()
  const [descending] = useFolderOrder()

  // The database is loaded in chunks and the entries of the initial page are
  // only the newest media. Their tree shows a few folders for a moment and is
  // replaced by the full tree once the database is loaded, see useLoadDatabase
  const root = useMemo(() => initialLoadDone ? buildTree(allEntries, showIndex, descending) : emptyRoot, [allEntries, initialLoadDone, showIndex, descending]);

  // the grid has no hierarchy and lists the folders of all tree levels
  const gridNodes = useMemo(() => isGrid ? flattenTree(root) : [], [root, isGrid])

  // the squares and the rows are scaled by the thumbnail size of the page
  const [ , sizeFactor ] = useFolderThumbnailSize()
  const [ deviceType ] = useDeviceType()
  const isMobile = deviceType === DeviceType.MOBILE
  const cellSize = Math.round((isMobile ? mobileCellSize : desktopCellSize) * sizeFactor)
  const rowHeight = Math.round((isMobile ? mobileRowHeight : desktopRowHeight) * sizeFactor)

  const [expanded, setExpanded] = useState<ExpandedMap>({})

  const toggle = (key: string) => setExpanded(expanded => ({...expanded, [key]: !expanded[key]}))

  return (
    <>
      <NavBar disableEdit={true} showFolders={true} />
      { !initialLoadDone &&
        <p className="m-4 text-gray-500">Loading folders ...</p>
      }
      { initialLoadDone && !root.children.length &&
        <p className="m-4 text-gray-500">No media found</p>
      }
      { isGrid ?
        // the cells fill the width and are at least of the cell size, like the
        // squared media list. The min() keeps a single column within the width
        <ul className="grid gap-2 m-4" style={{gridTemplateColumns: `repeat(auto-fill, minmax(min(${cellSize}px, 100%), 1fr))`}}>
          {gridNodes.map(node => (
            <FolderCard key={node.key} node={node} showCover={showCover} cellSize={cellSize} />
          ))}
        </ul> :
        // the rows fill the width and are spaced like the rows of the media
        // list layout
        <ul className="flex flex-col gap-2 p-1">
          {root.children.map(child => (
            <FolderItem key={child.key} node={child} level={0} showCover={showCover} rowHeight={rowHeight} expanded={expanded} toggle={toggle} />
          ))}
        </ul>
      }
    </>
  )
}
