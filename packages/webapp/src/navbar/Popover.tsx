import * as React from "react";
import { useEffect, useRef, useState } from "react";

import { classNames } from "../utils/class-names";

type TriggerProps = {
  isOpen: boolean
  /** Opens the panel or closes an open one */
  toggle: () => void
}

type PopoverProps = {
  /** Renders the element which opens and closes the panel */
  trigger: (props: TriggerProps) => React.ReactNode
  /** Renders the content of the panel. Its argument closes the panel */
  children: (close: () => void) => React.ReactNode
  /** Additional classes of the panel, eg its minimum width */
  panelClass?: string
}

/**
 * Panel which is anchored below its trigger and is closed by a click outside
 * of it or by Escape. The menus of the nav bar share it.
 *
 * The panel stays open on a click inside of it, so that a control can be used
 * more than once. A control which should close it takes the `close` of the
 * children
 */
export const Popover = ({trigger, children, panelClass}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const popover = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onClick = (e: MouseEvent) => {
      if (!popover.current?.contains(e.target as Node)) {
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

  return (
    <div className="relative" ref={popover}>
      {trigger({isOpen, toggle: () => setIsOpen(isOpen => !isOpen)})}
      { isOpen &&
        <div className={classNames('absolute left-0 z-20 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg top-full', panelClass)}>
          {children(() => setIsOpen(false))}
        </div>
      }
    </div>
  )
}
