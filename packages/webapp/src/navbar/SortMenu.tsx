import * as React from "react";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { classNames } from "../utils/class-names";
import { getOrder, orderKeys, parseOrder, setOrder, toggleDirection, type TOrder } from "../utils/orderQuery";
import { useAppConfig } from "../config/useAppConfig";
import { Popover } from "./Popover";
import { useSearchNavigate, useSearchTerm } from "./useSearchNavigate";

const directionIcon = (direction: string) => direction == 'asc' ? icons.faArrowUpShortWide : icons.faArrowDownWideShort

export const SortMenu = () => {
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

  const applyOrder = (next: TOrder, close: () => void) => {
    close()
    setOrder(term, next).then(nextTerm => navigateToSearch(encodeURIComponent(nextTerm)))
  }

  const onKeyClick = (key: string, close: () => void) => {
    if (key == order.key) {
      return applyOrder({...order, direction: toggleDirection(order.direction)}, close)
    }

    const orderKey = orderKeys.find(orderKey => orderKey.key == key)
    applyOrder({key, direction: orderKey?.defaultDirection || ''}, close)
  }

  const current = orderKeys.find(orderKey => orderKey.key == order.key)

  return (
    <Popover
      panelClass="min-w-48"
      trigger={({toggle}) => (
        <a className="flex items-center justify-center gap-2 px-2 py-2 text-gray-500 rounded shadow hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer active:bg-gray-600 active:text-gray-200"
          onClick={toggle}
          title={`Order by ${current?.name || order.key}`}>
          <FontAwesomeIcon icon={icons.faArrowDownShortWide} />
          <span className="max-md:hidden whitespace-nowrap">{current?.name || order.key}</span>
          { order.direction &&
            <FontAwesomeIcon icon={directionIcon(order.direction)} className="text-gray-600" />
          }
        </a>
      )}
    >
      {close => orderKeys.map(orderKey => {
        const isCurrent = orderKey.key == order.key
        return (
          <a key={orderKey.key}
            className={classNames('flex items-center justify-between gap-4 px-3 py-2 hover:bg-gray-700 hover:cursor-pointer', {
              'text-gray-300': isCurrent,
              'text-gray-500 hover:text-gray-300': !isCurrent})}
            onClick={() => onKeyClick(orderKey.key, close)}
            title={isCurrent && orderKey.defaultDirection ? 'Toggle the order direction' : `Order by ${orderKey.name}`}>
            <span className="whitespace-nowrap">{orderKey.name}</span>
            { isCurrent && order.direction &&
              <FontAwesomeIcon icon={directionIcon(order.direction)} />
            }
          </a>
        )
      })}
    </Popover>
  )
}
