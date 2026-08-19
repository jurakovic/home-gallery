import * as React from "react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavBar } from '../navbar/NavBar';
import { useEntryStore } from '../store/entry-store';
import { buildTree, type TreeNode } from './buildTree';
import { toFolderQuery } from './toFolderQuery';
import { useAppConfig } from '../config/useAppConfig';

type ExpandedMap = {[key: string]: boolean}

const FolderItem = ({node, level, expanded, toggle}: {node: TreeNode, level: number, expanded: ExpandedMap, toggle: (key: string) => void}) => {
  const isExpandable = node.children.length > 0
  const isExpanded = isExpandable && !!expanded[node.key]
  const query = toFolderQuery(node)
  // only shown with the showIndex option, otherwise every node has a path
  const isIndex = !node.path

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
          { !isExpandable &&
            <span className="w-8 p-4" />
          }
          <Link className="flex items-center justify-start min-w-0 gap-2 p-4 text-gray-500 grow group-hover:text-gray-300 hover:cursor-pointer"
            to={`/search/${encodeURIComponent(query)}`}
            title={`Search for '${query}'`}>
            <FontAwesomeIcon className="flex-shrink-0" icon={isIndex ? icons.faDatabase : (isExpanded ? icons.faFolderOpen : icons.faFolder)} />
            <span className="min-w-0 break-words">{node.name || '(no index)'} <span className="whitespace-nowrap">({node.count})</span></span>
          </Link>
        </span>
      </li>
      { isExpanded && node.children.map(child => (
        <FolderItem key={child.key} node={child} level={level + 1} expanded={expanded} toggle={toggle} />
      ))}
    </>
  )
}

export const Folders = () => {
  const allEntries = useEntryStore(state => state.allEntries);
  const appConfig = useAppConfig()
  const showIndex = !!appConfig.pages?.folders?.showIndex

  const [searchParams, setSearchParams] = useSearchParams()
  // the url is the source of truth so that an order can be shared. The config
  // sets the initial order only
  const descending = searchParams.has('dir') ?
    searchParams.get('dir') == 'desc' :
    appConfig.pages?.folders?.order == 'nameDesc'

  const root = useMemo(() => buildTree(allEntries, showIndex, descending), [allEntries, showIndex, descending]);

  const [expanded, setExpanded] = useState<ExpandedMap>({})

  const toggle = (key: string) => setExpanded(expanded => ({...expanded, [key]: !expanded[key]}))

  // the direction is always explicit, otherwise the toggle would fall back to
  // the configured order again
  const toggleOrder = () => setSearchParams({dir: descending ? 'asc' : 'desc'})

  return (
    <>
      <NavBar disableEdit={true} />
      <div className="flex flex-wrap items-center justify-between gap-2 m-4">
        <h2 className="text-xl text-gray-400">Folders</h2>
        <a className="flex items-center justify-center gap-2 px-2 py-1 text-gray-500 rounded hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer"
          onClick={toggleOrder}
          title={descending ? 'Order folders ascending by name' : 'Order folders descending by name'}>
          <FontAwesomeIcon icon={descending ? icons.faArrowDownWideShort : icons.faArrowUpShortWide} />
          <span className="text-sm">Name</span>
        </a>
      </div>
      { !root.children.length &&
        <p className="m-4 text-gray-500">No media found</p>
      }
      <ul className="m-4">
        {root.children.map(child => (
          <FolderItem key={child.key} node={child} level={0} expanded={expanded} toggle={toggle} />
        ))}
      </ul>
      <p className="m-4 text-sm text-gray-600">Counts show the visible media of a folder and its subfolders.</p>
    </>
  )
}
