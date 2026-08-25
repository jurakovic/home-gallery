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

/** Search term of a key and its value, `:` matches the value exactly */
export const queryTerm = (key: string, value: string, op: string = ':') => `${key}${op}${escapeSearchValue(value)}`

/**
 * Builds the search query of a directory of an index, which is an album of the
 * albums page and a part of the path breadcrumb of the media details.
 *
 * The directory holds the media of its own and the media of its
 * subdirectories, which are two terms: the `path` of a media is its directory,
 * so the media of the directory itself match it exactly and the media of a
 * subdirectory have it as their first part.
 *
 * The query language knows no prefix operator, so the subdirectories are
 * matched with the `~` (contains) operator on the path with a trailing slash.
 * It keeps the directories of a common name apart, `2026-05/` matches neither
 * `2026-05 foo` nor `2026-05 bar`, but it is still a substring match: a media
 * of `archive/2019/Sommer/June` is also found by the directory `2019/Sommer`
 */
export const toDirectoryQuery = (index: string, path: string) => {
  const terms = [queryTerm('index', index)]
  if (path) {
    const directory = queryTerm('path', path)
    const subDirectories = queryTerm('path', `${path}/`, '~')
    terms.push(`(${directory} or ${subDirectories})`)
  }
  return terms.join(' ')
}
