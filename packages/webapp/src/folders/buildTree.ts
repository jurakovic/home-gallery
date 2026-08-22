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
  /** Media of this directory or of a subdirectory which represents this node */
  cover?: Entry
  children: TreeNode[]
}

/** Cover state of a node while the tree is built */
interface CoverCandidate {
  /** Base name of the main file of the cover entry */
  name: string
  /** True if the base name is marked by the cover suffix */
  isMarked: boolean
}

/** Base name suffix before the file extension which marks a cover media */
const coverSuffixPattern = /_cover\.[^.]+$/i

const basename = (filename: string) => filename.slice(filename.lastIndexOf('/') + 1)

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

const compareName = (a: string, b: string) => {
  const aName = a.toLowerCase()
  const bName = b.toLowerCase()
  if (aName == bName) {
    return a < b ? -1 : 1
  }
  return aName < bName ? -1 : 1
}

const byName = (a: TreeNode, b: TreeNode) => compareName(a.name, b.name)

/**
 * Sets the cover of the node if the entry is a better cover candidate.
 *
 * A media which is marked by the cover suffix beats every unmarked media. The
 * first media by its base name wins otherwise. Media without a preview image
 * are no candidates
 */
const addCoverCandidate = (node: TreeNode, entry: Entry, filename: string, candidates: Map<TreeNode, CoverCandidate>) => {
  if (!entry.previews?.length) {
    return
  }

  const name = basename(filename)
  const isMarked = coverSuffixPattern.test(name)
  const current = candidates.get(node)
  if (current && (current.isMarked != isMarked ? current.isMarked : compareName(current.name, name) < 0)) {
    return
  }

  candidates.set(node, {name, isMarked})
  node.cover = entry
}

/**
 * Sets the cover of all nodes without an own cover media.
 *
 * Such a node inherits the cover of its first subdirectory by name. The name
 * order is independent from the folder order so that the cover of a node stays
 * the same if the folder order is reversed
 */
const inheritCovers = (node: TreeNode) => {
  node.children.forEach(inheritCovers)
  if (node.cover) {
    return
  }

  node.cover = [...node.children].sort(byName).find(child => child.cover)?.cover
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
 *
 * Every node gets a cover media of its directory or of a subdirectory, see
 * `addCoverCandidate` and `inheritCovers`.
 */
export const buildTree = (entries: Entry[], showIndex: boolean = false, descending: boolean = false): TreeNode => {
  const root = createNode('', '', '')
  const indexNodes = createNode('', '', '')
  const coverCandidates = new Map<TreeNode, CoverCandidate>()

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
    addCoverCandidate(node, entry, file.filename, coverCandidates)
  }

  inheritCovers(indexNodes)
  root.cover = indexNodes.cover

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

/**
 * Returns all folder nodes of the tree in their display order.
 *
 * The nodes are flattened depth first, so a folder is directly followed by its
 * subfolders. The virtual root itself is not part of the result
 */
export const flattenTree = (node: TreeNode): TreeNode[] =>
  node.children.flatMap(child => [child, ...flattenTree(child)])
