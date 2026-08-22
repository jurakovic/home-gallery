import * as React from "react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavBar } from '../navbar/NavBar';
import { useEntryStore } from '../store/entry-store';
import { buildTree, flattenTree, type TreeNode } from './buildTree';
import { toFolderQuery } from './toFolderQuery';
import { useAppConfig } from '../config/useAppConfig';
import { getHigherPreviewUrl } from '../utils/preview';
import { classNames } from '../utils/class-names';
import { useDeviceType, DeviceType } from '../utils/useDeviceType';
import { useThumbnailSize } from '../list/useThumbnailLayout';
import { mobileGridSize, desktopGridSize } from '../list/grid';

type ExpandedMap = {[key: string]: boolean}

/** Empty tree while the initial database load is still pending */
const emptyRoot = buildTree([])

/** Rendered size of the folder cover in pixels. It matches the w-10 h-10 box */
const coverSize = 40

const buttonClass = 'flex items-center justify-center gap-2 px-2 py-1 text-gray-500 rounded hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer'

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

const FolderItem = ({node, level, showCover, expanded, toggle}: {node: TreeNode, level: number, showCover: boolean, expanded: ExpandedMap, toggle: (key: string) => void}) => {
  const isExpandable = node.children.length > 0
  const isExpanded = isExpandable && !!expanded[node.key]
  const query = toFolderQuery(node)
  const icon = getFolderIcon(node, isExpanded)
  const coverUrl = getCoverUrl(node, showCover, coverSize)

  return (
    <>
      <li className="border border-collapse border-gray-800">
        <span className="group flex items-center justify-start hover:bg-gray-700" style={{paddingLeft: `${level}rem`}}>
          { isExpandable &&
            <a className="flex items-center justify-center w-8 p-4 text-gray-500 group-hover:text-gray-300 hover:bg-gray-600 hover:cursor-pointer"
              onClick={() => toggle(node.key)}
              title={isExpanded ? 'Collapse folder' : 'Expand folder'}>
              <FontAwesomeIcon icon={isExpanded ? icons.faAngleDown : icons.faAngleRight} />
            </a>
          }
          <Link className={classNames('flex items-center justify-start min-w-0 gap-2 text-sm text-gray-500 md:text-base grow group-hover:text-gray-300 hover:cursor-pointer', showCover ? 'px-4 py-2' : 'p-4')}
            to={`/search/${encodeURIComponent(query)}`}
            title={`Search for '${query}'`}>
            { showCover ?
              // the box keeps the row height of folders without a cover media
              <span className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded bg-gray-800">
                { coverUrl ?
                  <img className="object-cover w-full h-full rounded" src={coverUrl} alt="" loading="lazy" /> :
                  <FontAwesomeIcon icon={icon} />
                }
              </span> :
              <FontAwesomeIcon className="flex-shrink-0" icon={icon} />
            }
            <span className="min-w-0 break-words">{node.name || '(no index)'} <span className="whitespace-nowrap">({node.count})</span></span>
          </Link>
        </span>
      </li>
      { isExpanded && node.children.map(child => (
        <FolderItem key={child.key} node={child} level={level + 1} showCover={showCover} expanded={expanded} toggle={toggle} />
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

  const [searchParams, setSearchParams] = useSearchParams()
  // the url is the source of truth so that an order and a view can be shared.
  // The config sets the initial values only
  const descending = searchParams.has('dir') ?
    searchParams.get('dir') == 'desc' :
    appConfig.pages?.folders?.order == 'nameDesc'
  const isGrid = searchParams.has('view') ?
    searchParams.get('view') == 'grid' :
    appConfig.pages?.folders?.view == 'grid'

  // The database is loaded in chunks and the entries of the initial page are
  // only the newest media. Their tree shows a few folders for a moment and is
  // replaced by the full tree once the database is loaded, see useLoadDatabase
  const root = useMemo(() => initialLoadDone ? buildTree(allEntries, showIndex, descending) : emptyRoot, [allEntries, initialLoadDone, showIndex, descending]);

  // the grid has no hierarchy and lists the folders of all tree levels
  const gridNodes = useMemo(() => isGrid ? flattenTree(root) : [], [root, isGrid])

  // the squares use the thumbnail size of the media lists, so that the size
  // controls of the nav bar change both
  const [ , sizeFactor ] = useThumbnailSize()
  const [ deviceType ] = useDeviceType()
  const cellSize = Math.round((deviceType === DeviceType.MOBILE ? mobileGridSize : desktopGridSize) * sizeFactor)

  const [expanded, setExpanded] = useState<ExpandedMap>({})

  const toggle = (key: string) => setExpanded(expanded => ({...expanded, [key]: !expanded[key]}))

  // the value is always explicit, otherwise the toggle would fall back to the
  // configured value again. Other params are kept
  const setParam = (key: string, value: string) => setSearchParams(params => {
    params.set(key, value)
    return params
  })

  // the direction is always explicit, otherwise the toggle would fall back to
  // the configured order again
  const toggleOrder = () => setParam('dir', descending ? 'asc' : 'desc')

  const toggleView = () => setParam('view', isGrid ? 'list' : 'grid')

  return (
    <>
      <NavBar disableEdit={true} showSize={isGrid} />
      <div className="flex flex-wrap items-center justify-between gap-2 m-4">
        <h2 className="text-xl text-gray-400">Folders</h2>
        <div className="flex flex-wrap items-center gap-2">
          <a className={buttonClass}
            onClick={toggleView}
            title={isGrid ? 'Show the folders as list' : 'Show the folders as grid'}>
            <FontAwesomeIcon icon={isGrid ? icons.faTableCellsLarge : icons.faList} />
            <span className="text-sm">{isGrid ? 'Grid' : 'List'}</span>
          </a>
          <a className={buttonClass}
            onClick={toggleOrder}
            title={descending ? 'Order folders ascending by name' : 'Order folders descending by name'}>
            <FontAwesomeIcon icon={descending ? icons.faArrowDownWideShort : icons.faArrowUpShortWide} />
            <span className="text-sm">Name</span>
          </a>
        </div>
      </div>
      { !initialLoadDone &&
        <p className="m-4 text-gray-500">Loading folders ...</p>
      }
      { initialLoadDone && !root.children.length &&
        <p className="m-4 text-gray-500">No media found</p>
      }
      { isGrid ?
        // the cells fill the width and are at least of the cell size, like the
        // squared media list. The min() keeps a single column within the width
        <ul className="grid gap-4 m-4" style={{gridTemplateColumns: `repeat(auto-fill, minmax(min(${cellSize}px, 100%), 1fr))`}}>
          {gridNodes.map(node => (
            <FolderCard key={node.key} node={node} showCover={showCover} cellSize={cellSize} />
          ))}
        </ul> :
        <ul className="m-4">
          {root.children.map(child => (
            <FolderItem key={child.key} node={child} level={0} showCover={showCover} expanded={expanded} toggle={toggle} />
          ))}
        </ul>
      }
      <p className="m-4 text-sm text-gray-600">Counts show the visible media of a folder and its subfolders.</p>
    </>
  )
}
