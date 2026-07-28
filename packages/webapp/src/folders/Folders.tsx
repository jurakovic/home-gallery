import * as React from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavBar } from '../navbar/NavBar';
import { useEntryStore } from '../store/entry-store';
import { buildTree, type TreeNode } from './buildTree';
import { toFolderQuery } from './toFolderQuery';

type ExpandedMap = {[key: string]: boolean}

const FolderItem = ({node, level, expanded, toggle}: {node: TreeNode, level: number, expanded: ExpandedMap, toggle: (key: string) => void}) => {
  const isExpandable = node.children.length > 0
  const isExpanded = isExpandable && !!expanded[node.key]
  const query = toFolderQuery(node)
  const isIndex = !node.path

  return (
    <>
      <li className="border border-collapse border-gray-800">
        <span className="flex items-center justify-start" style={{paddingLeft: `${level}rem`}}>
          { isExpandable &&
            <a className="flex items-center justify-center w-8 p-4 text-gray-500 hover:text-gray-300 hover:bg-gray-700 hover:cursor-pointer"
              onClick={() => toggle(node.key)}
              title={isExpanded ? 'Collapse folder' : 'Expand folder'}>
              <FontAwesomeIcon icon={isExpanded ? icons.faAngleDown : icons.faAngleRight} />
            </a>
          }
          { !isExpandable &&
            <span className="w-8 p-4" />
          }
          <Link className="flex items-center justify-start gap-2 p-4 text-gray-500 grow hover:text-gray-300 hover:bg-gray-700 hover:cursor-pointer"
            to={`/search/${encodeURIComponent(query)}`}
            title={`Search for '${query}'`}>
            <FontAwesomeIcon icon={isIndex ? icons.faDatabase : (isExpanded ? icons.faFolderOpen : icons.faFolder)} />
            <span className="break-all">{node.name || '(no index)'} - {node.count}</span>
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

  const root = useMemo(() => buildTree(allEntries), [allEntries]);

  const [expanded, setExpanded] = useState<ExpandedMap>({})

  const toggle = (key: string) => setExpanded(expanded => ({...expanded, [key]: !expanded[key]}))

  return (
    <>
      <NavBar disableEdit={true} />
      <h2 className="m-4 text-xl text-gray-400">Folders</h2>
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
