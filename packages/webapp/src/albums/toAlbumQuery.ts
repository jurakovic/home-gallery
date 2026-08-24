import type { TreeNode } from './buildTree'

/**
 * Characters which the lexer of the query grammar does not read as part of a
 * bare value token. They are either a token of their own or start one:
 * whitespace, the comparators, the parens of a list, the brackets of a range,
 * the colon of a key value, the comma of a list, the tilde of the contains
 * operator and both quotes, which open a quoted text token.
 *
 * A value with one of them has to be quoted. The slash is no such character:
 * it is a token, but the value rules of the grammar join it back into a value,
 * so a path stays a bare value.
 *
 * See packages/query/src/parser/grammar.ne
 */
const bareValuePattern = /^[^ \t\n\r:=<>!()[\],~"']+$/

export const escapeSearchValue = (value: string) => {
  if (bareValuePattern.test(value)) {
    return value
  }
  // the quoted text token of the grammar escapes the quote and the backslash
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
