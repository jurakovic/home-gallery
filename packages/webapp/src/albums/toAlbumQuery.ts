import { toDirectoryQuery } from '../utils/searchQuery'
import type { TreeNode } from './buildTree'

/**
 * Builds the search query of a tree node.
 *
 * An album is the directory of its media, so it is searched like the path
 * breadcrumb of the media details view: the media of the album itself and the
 * media of its sub-albums, which are counted by the album as well
 */
export const toAlbumQuery = (node: TreeNode) => toDirectoryQuery(node.index, node.path)
