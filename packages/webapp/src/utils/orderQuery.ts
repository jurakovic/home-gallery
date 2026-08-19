import { parse } from '@home-gallery/query'

export type TOrderDirection = 'asc' | 'desc'

export type TOrder = {
  /** Order key as written in the query, eg 'date' or 'count(files)' */
  key: string
  /** Empty if the query has no explicit direction */
  direction: TOrderDirection | ''
}

export type TOrderKey = {
  key: string
  name: string
  /** Direction of the query language if none is given. Empty for unordered keys */
  defaultDirection: TOrderDirection | ''
}

/**
 * Order keys of the query language which are offered in the UI.
 *
 * See packages/query/src/query/order-by.js for all supported keys
 */
export const orderKeys: TOrderKey[] = [
  {key: 'date', name: 'Date', defaultDirection: 'desc'},
  {key: 'file', name: 'File path', defaultDirection: 'asc'},
  {key: 'updated', name: 'Updated', defaultDirection: 'desc'},
  {key: 'filesize', name: 'File size', defaultDirection: 'desc'},
  {key: 'duration', name: 'Duration', defaultDirection: 'desc'},
  {key: 'count(tags)', name: 'Tag count', defaultDirection: 'desc'},
]

/**
 * Order keys of the query language. An unknown key is not sorted at all
 *
 * See packages/query/src/query/order-by.js
 */
export const knownOrderKeys = [
  'date', 'updated', 'duration', 'width', 'height', 'filesize', 'random',
  'file', 'filename',
  'count(files)', 'count(tags)', 'count(faces)', 'count(objects)'
]

export const isKnownOrderKey = (key: string) => knownOrderKeys.includes(key)

/**
 * Fallback order of the webapp. It is used if no order is configured. The
 * defaultOrder query plugin adds the order to every query without an explicit
 * order expression
 *
 * See packages/webapp/src/plugin/defaultQueryPlugin.ts
 */
export const defaultOrder: TOrder = {key: 'date', direction: 'desc'}

/**
 * Reads an order of a config value like `date asc` or `count(files) desc`.
 *
 * A leading `order by` is accepted, too. Returns the `defaultOrder` for an
 * empty value
 */
export const parseOrder = (value?: string): TOrder => {
  const parts = (value || '').replace(/^\s*order\s+by\s+/i, '').trim().split(/\s+/)
  const key = parts[0]
  if (!key) {
    return defaultOrder
  }

  const direction = (parts[1] || '').toLowerCase()
  return {
    key,
    direction: direction == 'asc' || direction == 'desc' ? direction : ''
  }
}

// Fallback to cut the order expression of an unparsable query
const orderPattern = /\s*\border\s+by\s+\S+(\s+(asc|desc))?\s*$/i

const toOrder = (orderByAst: any): TOrder | null => {
  const value = orderByAst?.value
  if (!value) {
    return null
  }

  const key = value.type == 'orderFn' ? `${value.fn}(${value.value})` : value.value
  return {
    key,
    direction: orderByAst.direction || ''
  }
}

/**
 * Reads the order expression of a query term.
 *
 * Returns null if the term has no order expression. The webapp orders by
 * `defaultOrder` in that case
 */
export const getOrder = async (term: string): Promise<TOrder | null> => {
  return parse(term || '')
    .then((ast: any) => toOrder(ast.orderBy))
    .catch(() => null)
}

/**
 * Removes the order expression of a query term.
 *
 * The order expression is the last part of a query, so the term is cut at the
 * column of its `order` keyword. The column of the lexer is one based and
 * queries are single line
 */
export const removeOrder = async (term: string): Promise<string> => {
  if (!term?.trim()) {
    return ''
  }

  return parse(term)
    .then((ast: any) => ast.orderBy ? term.slice(0, ast.orderBy.col - 1) : term)
    .catch(() => term.replace(orderPattern, ''))
    .then(rest => rest.trim())
}

/**
 * Replaces the order expression of a query term by the given order
 */
export const setOrder = async (term: string, order: TOrder | null): Promise<string> => {
  const rest = await removeOrder(term)
  if (!order) {
    return rest
  }

  const orderTerm = `order by ${order.key}${order.direction ? ` ${order.direction}` : ''}`
  return rest ? `${rest} ${orderTerm}` : orderTerm
}

export const toggleDirection = (direction: TOrderDirection | ''): TOrderDirection => direction == 'asc' ? 'desc' : 'asc'
