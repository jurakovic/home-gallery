import type { TreeNode } from './buildTree'

// Characters which are not allowed in the bare value token of the query grammar
// See packages/query/src/parser/grammar.ne
const bareValuePattern = /^[^ \t\n\r:=<>!()[\],+]+$/

export const escapeSearchValue = (value: string) => {
  if (bareValuePattern.test(value)) {
    return value
  }
  return `"${value.replace(/(["\\])/g, '\\$1')}"`
}

const queryTerm = (key: string, value: string, op: string = ':') => `${key}${op}${escapeSearchValue(value)}`

/**
 * Builds the search query of a tree node.
 *
 * The path is matched with the `~` (contains) operator like the path breadcrumb
 * of the media details view does. The query language has no prefix operator, so
 * the match is a substring match on the directory name: `path~2019/Sommer` also
 * matches `archive/2019/Sommer`.
 */
export const toAlbumQuery = (node: TreeNode) => {
  const terms = [queryTerm('index', node.index)]
  if (node.path) {
    terms.push(queryTerm('path', node.path, '~'))
  }
  return terms.join(' ')
}
