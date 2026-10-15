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
  /**
   * ISO date when the first media of this node and all its children was added
   * to the gallery. It is empty if any of these media has no added date, e.g.
   * from a database of an older version
   */
  firstAdded: string
  /**
   * ISO date when the last media of this node and all its children was added
   * to the gallery. Empty if none of them has an added date
   */
  lastAdded: string
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
  firstAdded: '',
  lastAdded: '',
  children: []
})

/**
 * Adds the added date of a media to the node. A media without an added date
 * counts as added long ago: it keeps the node from being new, but a later
 * media still marks it as updated
 */
const addAdded = (node: TreeNode, added: string, isFirst: boolean) => {
  if (isFirst || added < node.firstAdded) {
    node.firstAdded = added
  }
  if (added > node.lastAdded) {
    node.lastAdded = added
  }
}

const getChild = (parent: TreeNode, name: string, index: string, path: string): TreeNode => {
  const child = parent.children.find(child => child.name == name)
  if (child) {
    return child
  }

  const node = createNode(name, index, path)
  parent.children.push(node)
  return node
}

/**
 * Compares two names case insensitive and falls back to the case sensitive
 * order of equal names. It returns 0 for equal names, so that a sort keeps the
 * order of the ties instead of swapping them
 */
const compareName = (a: string, b: string) => {
  const aName = a.toLowerCase()
  const bName = b.toLowerCase()
  if (aName != bName) {
    return aName < bName ? -1 : 1
  }
  return a == b ? 0 : (a < b ? -1 : 1)
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
  // an equal name keeps the current candidate, so the first media of a name wins
  if (current && (current.isMarked != isMarked ? current.isMarked : compareName(current.name, name) <= 0)) {
    return
  }

  candidates.set(node, {name, isMarked})
  node.cover = entry
}

/**
 * Sets the cover of all nodes without an own cover media.
 *
 * Such a node inherits the cover of its first subdirectory by name. The name
 * order is independent from the album order so that the cover of a node stays
 * the same if the album order is reversed
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
 * The albums of every level are ordered by their name, `descending` reverses
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

    const added = typeof file.added == 'string' ? file.added : ''
    const indexNode = getChild(indexNodes, index, index, '')
    addAdded(root, added, !root.count++)
    addAdded(indexNode, added, !indexNode.count++)

    let node = indexNode
    let path = ''
    for (const dir of dirs) {
      if (!dir) {
        continue
      }
      path = path ? `${path}/${dir}` : dir
      node = getChild(node, dir, index, path)
      addAdded(node, added, !node.count++)
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

/** Mark of an album with recently added media */
export type RecentMark = 'new' | 'updated' | false

/**
 * Returns the mark of an album by the added dates of its media. An album is
 * new if all its media were added since the given ISO date and updated if
 * some of them were
 */
export const getRecentMark = (node: TreeNode, since: string): RecentMark => {
  if (!node.lastAdded || node.lastAdded < since) {
    return false
  }
  return node.firstAdded >= since ? 'new' : 'updated'
}

/**
 * Returns all album nodes of the tree in their display order.
 *
 * The nodes are flattened depth first, so an album is directly followed by its
 * sub-albums. The virtual root itself is not part of the result
 */
export const flattenTree = (node: TreeNode): TreeNode[] =>
  node.children.flatMap(child => [child, ...flattenTree(child)])
