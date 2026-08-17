import type { TAst, TPlugin, TPluginManager, TQueryPlugin } from "@home-gallery/types";

import { defaultOrder, isKnownOrderKey, parseOrder, type TOrder } from "../utils/orderQuery";

const yearQuery: TQueryPlugin = {
  name: 'year',
  transformRules: [{
    types: ['query'],
    transform(ast, context) {
      if (!context.plugin.year?.value) {
        // no year query
        return ast
      }

      const orderKey: TAst = {type: 'orderKey', value: 'date', col: ast.col}
      const orderBy: TAst = ast.orderBy ? ast.orderBy : {type: 'orderBy', value: orderKey, direction: 'asc', col: ast.col}
      const comboundKey: TAst = {type: 'comboundValue', value: context.plugin.year.value, col: ast.col}
      const keyValue: TAst = {type: 'keyValue', key: 'year', value: comboundKey, col: ast.col}

      if (ast.value?.type == 'noop') {
        // empty query
        return {...ast, value: keyValue, orderBy}
      }

      const and: TAst = {type: 'and', value: [keyValue, ast.value as TAst], col: ast.col}
      return {...ast, value: and, orderBy}
    }
  }]
}

const countFnPattern = /^count\((\w+)\)$/

const toOrderValue = (key: string, col: number): TAst => {
  const countFn = key.match(countFnPattern)
  if (countFn) {
    return {type: 'orderFn', fn: 'count', value: countFn[1], col}
  }

  return {type: 'orderKey', value: key, col}
}

/**
 * Adds the order of `webapp.pages.list.defaultOrder` to every query without an
 * explicit order expression
 */
const createDefaultOrder = (order: TOrder): TQueryPlugin => ({
  name: 'defaultOrder',
  order: 90,
  transformRules: [{
    types: ['query'],
    transform(ast, context) {
      if (ast.orderBy) {
        return ast
      }

      const orderValue = toOrderValue(order.key, ast.col)
      // false is the parser value for a missing direction. The order key falls
      // back to its own direction than
      const orderBy: TAst = {type: 'orderBy', value: orderValue, direction: order.direction || false, col: ast.col}

      return {...ast, orderBy}
    }
  }]
})

const DefaultQueryPlugin: TPlugin = {
  name: 'default',
  version: '1.0',
  async initialize(manager: TPluginManager) {
    const configured = parseOrder((manager.getConfig() as any)?.pages?.list?.defaultOrder)
    const isKnown = isKnownOrderKey(configured.key)
    if (!isKnown) {
      manager.createLogger('defaultQueryPlugin').warn(`Unknown order key '${configured.key}' of webapp.pages.list.defaultOrder. Order by ${defaultOrder.key} ${defaultOrder.direction} instead`)
    }

    manager.register('query', yearQuery)
    manager.register('query', createDefaultOrder(isKnown ? configured : defaultOrder))
  }
}

export default DefaultQueryPlugin