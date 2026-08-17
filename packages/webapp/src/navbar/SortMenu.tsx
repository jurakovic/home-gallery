import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { classNames } from "../utils/class-names";
import { defaultOrder, getOrder, orderKeys, setOrder, toggleDirection, type TOrder } from "../utils/orderQuery";
import { useSearchNavigate, useSearchTerm } from "./useSearchNavigate";

const directionIcon = (direction: string) => direction == 'asc' ? icons.faArrowUpShortWide : icons.faArrowDownWideShort

export const SortMenu = () => {
  const term = useSearchTerm()
  const navigateToSearch = useSearchNavigate()

  const [order, setCurrentOrder] = useState<TOrder>(defaultOrder)
  const [isOpen, setIsOpen] = useState(false)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let outdated = false
    // the query term is the source of truth. Fall back to the order which the
    // defaultOrder query plugin adds to queries without an order expression
    getOrder(term).then(order => !outdated && setCurrentOrder(order || defaultOrder))
    return () => { outdated = true }
  }, [term])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onClick = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => e.key == 'Escape' && setIsOpen(false)

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [isOpen])

  const applyOrder = (next: TOrder) => {
    setIsOpen(false)
    setOrder(term, next).then(nextTerm => navigateToSearch(encodeURIComponent(nextTerm)))
  }

  const onKeyClick = (key: string) => {
    if (key == order.key) {
      return applyOrder({...order, direction: toggleDirection(order.direction)})
    }

    const orderKey = orderKeys.find(orderKey => orderKey.key == key)
    applyOrder({key, direction: orderKey?.defaultDirection || ''})
  }

  const current = orderKeys.find(orderKey => orderKey.key == order.key)

  return (
    <div className="relative" ref={menu}>
      <a className="flex items-center justify-center gap-2 px-2 py-2 text-gray-500 rounded shadow hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer active:bg-gray-600 active:text-gray-200"
        onClick={() => setIsOpen(isOpen => !isOpen)}
        title={`Order by ${current?.name || order.key}`}>
        <FontAwesomeIcon icon={icons.faArrowDownShortWide} />
        <span className="max-md:hidden whitespace-nowrap">{current?.name || order.key}</span>
        { order.direction &&
          <FontAwesomeIcon icon={directionIcon(order.direction)} className="text-gray-600" />
        }
      </a>
      { isOpen &&
        <div className="absolute left-0 z-20 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg top-full min-w-48">
          { orderKeys.map(orderKey => {
            const isCurrent = orderKey.key == order.key
            return (
              <a key={orderKey.key}
                className={classNames('flex items-center justify-between gap-4 px-3 py-2 hover:bg-gray-700 hover:cursor-pointer', {
                  'text-gray-300': isCurrent,
                  'text-gray-500 hover:text-gray-300': !isCurrent})}
                onClick={() => onKeyClick(orderKey.key)}
                title={isCurrent && orderKey.defaultDirection ? 'Toggle the order direction' : `Order by ${orderKey.name}`}>
                <span className="whitespace-nowrap">{orderKey.name}</span>
                { isCurrent && order.direction &&
                  <FontAwesomeIcon icon={directionIcon(order.direction)} />
                }
              </a>
            )
          })}
        </div>
      }
    </div>
  )
}
