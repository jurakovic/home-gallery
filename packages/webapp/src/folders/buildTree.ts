import type { Entry } from '../store/entry'

export interface TreeNode {
  /** Directory name of this node. Empty for the virtual root */
  name: string
  /** Index name this node belongs to. Empty for the virtual root */
  index: string
  /**
   * Index relative directory path of this node with forward slashes.
   * Empty for the virtual root
   */
  path: string
  /** Unique key of the node, built from index and path */
  key: string
  /** Amount of visible media of this node and all its children */
  count: number
  /** Amount of visible media which are directly in this directory */
  ownCount: number
  children: TreeNode[]
}

const createNode = (name: string, index: string, path: string): TreeNode => ({
  name,
  index,
  path,
  key: `${index}:${path}`,
  count: 0,
  ownCount: 0,
  children: []
})

const getChild = (parent: TreeNode, name: string, index: string, path: string): TreeNode => {
  const child = parent.children.find(child => child.name == name)
  if (child) {
    return child
  }

  const node = createNode(name, index, path)
  parent.children.push(node)
  return node
}

const byName = (a: TreeNode, b: TreeNode) => {
  const aName = a.name.toLowerCase()
  const bName = b.name.toLowerCase()
  if (aName == bName) {
    return a.name < b.name ? -1 : 1
  }
  return aName < bName ? -1 : 1
}

const sortChildren = (node: TreeNode, compare: (a: TreeNode, b: TreeNode) => number) => {
  node.children.sort(compare)
  node.children.forEach(child => sortChildren(child, compare))
}

/**
 * Builds a directory tree of the given entries.
 *
 * The tree is built from the main file of an entry (`files[0]`) only. Sidecar
 * files can live in other directories than the main file and would double count
 * entries otherwise.
 *
 * The folders of every level are ordered by their name, `descending` reverses
 * the order.
 *
 * The tree levels are the index relative directories of the media files. An
 * index is the mounted source directory and would be a single node which every
 * other node is below. It is therefore skipped by default and its direct
 * subdirectories are the first tree level. With `showIndex` the index nodes are
 * the first tree level instead, which also lists media of the source directory
 * itself.
 *
 * Counts are visible counts: they only reflect the entries of the given list,
 * which is already filtered by the server for the current user.
 */
export const buildTree = (entries: Entry[], showIndex: boolean = false, descending: boolean = false): TreeNode => {
  const root = createNode('', '', '')
  const indexNodes = createNode('', '', '')

  for (const entry of entries) {
    const file = entry.files?.[0]
    if (!file?.filename) {
      continue
    }

    const index = file.index || ''
    const dirs = file.filename.split('/')
    // last part is the basename and is not part of the tree
    dirs.pop()

    const indexNode = getChild(indexNodes, index, index, '')
    root.count++
    indexNode.count++

    let node = indexNode
    let path = ''
    for (const dir of dirs) {
      if (!dir) {
        continue
      }
      path = path ? `${path}/${dir}` : dir
      node = getChild(node, dir, index, path)
      node.count++
    }
    node.ownCount++
  }

  if (showIndex) {
    root.children = indexNodes.children
  } else {
    // Skip the index level: the subdirectories of all indices are the first level
    root.children = indexNodes.children.flatMap(indexNode => indexNode.children)
    root.ownCount = indexNodes.children.reduce((sum, indexNode) => sum + indexNode.ownCount, 0)
  }

  sortChildren(root, descending ? (a, b) => -byName(a, b) : byName)

  return root
}
