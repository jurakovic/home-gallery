import { useEffect, useState } from "react";

import { useAppConfig } from "../config/useAppConfig";
import { getOrder, orderKeys, parseOrder, setOrder, toggleDirection, type TOrder } from "../utils/orderQuery";
import { useSearchNavigate, useSearchTerm } from "./useSearchNavigate";

/**
 * Order of the current media list and the setter of its order key.
 *
 * The order expression of the query term is the source of truth. The order of
 * the config is shown as long as the query has no explicit order, which the
 * defaultOrder query plugin adds to it
 */
export const useOrder = (): [TOrder, (key: string) => void] => {
  const term = useSearchTerm()
  const navigateToSearch = useSearchNavigate()
  const appConfig = useAppConfig()

  // the order which the defaultOrder query plugin adds to queries without an
  // order expression
  const configOrder = parseOrder(appConfig.pages?.list?.defaultOrder)

  const [order, setCurrentOrder] = useState<TOrder>(configOrder)

  useEffect(() => {
    let outdated = false
    // the query term is the source of truth
    getOrder(term).then(order => !outdated && setCurrentOrder(order || configOrder))
    return () => { outdated = true }
  }, [term, configOrder.key, configOrder.direction])

  /**
   * The current key toggles its direction, another key starts with its default
   * direction
   */
  const applyKey = (key: string) => {
    const next: TOrder = key == order.key ?
      {...order, direction: toggleDirection(order.direction)} :
      {key, direction: orderKeys.find(orderKey => orderKey.key == key)?.defaultDirection || ''}

    setOrder(term, next).then(nextTerm => navigateToSearch(nextTerm))
  }

  return [order, applyKey]
}
