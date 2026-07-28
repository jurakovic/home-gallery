import type { Entry } from '../store/entry'

export interface TreeNode {
  /** Directory name of this node. Empty for the virtual root */
  name: string
  /** Index name this node belongs to. Empty for the virtual root */
  index: string
  /**
   * Index relative directory path of this node with forward slashes.
   * Empty for the virtual root and for index nodes
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

const sortChildren = (node: TreeNode) => {
  node.children.sort(byName)
  node.children.forEach(sortChildren)
}

/**
 * Builds a directory tree of the given entries.
 *
 * The tree is built from the main file of an entry (`files[0]`) only. Sidecar
 * files can live in other directories than the main file and would double count
 * entries otherwise.
 *
 * The first tree level are the index names, the levels below are the index
 * relative directories of the media files.
 *
 * Counts are visible counts: they only reflect the entries of the given list,
 * which is already filtered by the server for the current user.
 */
export const buildTree = (entries: Entry[]): TreeNode => {
  const root = createNode('', '', '')

  for (const entry of entries) {
    const file = entry.files?.[0]
    if (!file?.filename) {
      continue
    }

    const index = file.index || ''
    const dirs = file.filename.split('/')
    // last part is the basename and is not part of the tree
    dirs.pop()

    const indexNode = getChild(root, index, index, '')
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

  sortChildren(root)

  return root
}
