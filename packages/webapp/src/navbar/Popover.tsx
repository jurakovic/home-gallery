import * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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

/** Space which the panel keeps to the edge of the view */
const viewMargin = 8

/**
 * Panel which is anchored below its trigger and is closed by a click outside
 * of it or by Escape. The menus of the nav bar share it.
 *
 * The panel stays open on a click inside of it, so that a control can be used
 * more than once. A control which should close it takes the `close` of the
 * children.
 *
 * A click outside of it only closes the panel. Its backdrop swallows the
 * click, so that it does not open the media or the album below the panel as
 * well
 */
export const Popover = ({trigger, children, panelClass}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  /**
   * Horizontal shift which keeps the panel in the view. The panel is anchored
   * at the left of its trigger, so a trigger at the right of the nav bar would
   * push it over the right edge of the view. The nav bar of a phone holds an
   * item per page and its menu is the last of them
   */
  const [shift, setShift] = useState(0)

  useLayoutEffect(() => {
    if (!isOpen) {
      return
    }

    const fitIntoView = () => {
      const panel = panelRef.current
      if (!panel) {
        return
      }

      // the rect carries the shift of the current render, the anchor is without it
      const {left, right} = panel.getBoundingClientRect()
      const overflow = right - shift - (window.innerWidth - viewMargin)
      // a panel which is wider than the view keeps its left edge visible
      setShift(overflow > 0 ? -Math.min(overflow, left - shift - viewMargin) : 0)
    }

    fitIntoView()
    // the panel is measured again on a rotated phone
    window.addEventListener('resize', fitIntoView)

    return () => window.removeEventListener('resize', fitIntoView)
  }, [isOpen, shift])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyUp = (e: KeyboardEvent) => e.key == 'Escape' && setIsOpen(false)

    document.addEventListener('keyup', onKeyUp)

    return () => document.removeEventListener('keyup', onKeyUp)
  }, [isOpen])

  return (
    <div className="relative">
      {trigger({isOpen, toggle: () => setIsOpen(isOpen => !isOpen)})}
      { isOpen &&
        <>
          {/*
            * The backdrop covers the page below the nav bar and takes the
            * click or the tap which closes the panel. A document listener
            * could not do that: it would close the panel, but the event would
            * still reach the media or the album below it and open it
            */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div ref={panelRef}
            className={classNames('absolute left-0 z-20 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg top-full', panelClass)}
            style={shift ? {transform: `translateX(${shift}px)`} : undefined}>
            {children(() => setIsOpen(false))}
          </div>
        </>
      }
    </div>
  )
}
