import { useEffect, useRef } from 'react'

export type TSwipeDirection = 'left' | 'right'

/** Minimal horizontal distance of a swipe in css pixels */
const minDistance = 60

/** A slower move is a pan and no swipe */
const maxDuration = 600

/**
 * Width of the screen edges in which a touch starts no swipe. The browsers and
 * the phones use a swipe from the edge to go back, which should not change
 * the page as well
 */
const edgeWidth = 24

/**
 * Calls back on a horizontal swipe of one finger anywhere on the page.
 *
 * The listeners are passive and never cancel a touch, so that the vertical
 * scroll of the page and the tap and press gestures of the thumbnails stay
 * untouched. A move counts as a swipe only if it is fast and clearly more
 * horizontal than vertical, so that scrolling the list does not trigger it.
 * A zoomed page is panned by a horizontal move and is ignored therefore
 */
export const useHorizontalSwipe = (onSwipe: (direction: TSwipeDirection) => void) => {
  // the callback changes with every render, the listeners stay
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe

  useEffect(() => {
    let start: {x: number, y: number, time: number} | undefined

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const isZoomed = (window.visualViewport?.scale ?? 1) > 1.01
      const isEdge = touch.clientX < edgeWidth || touch.clientX > window.innerWidth - edgeWidth
      if (e.touches.length != 1 || isZoomed || isEdge) {
        start = undefined
        return
      }
      start = {x: touch.clientX, y: touch.clientY, time: e.timeStamp}
    }

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!start || e.touches.length || !touch) {
        start = undefined
        return
      }
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      const duration = e.timeStamp - start.time
      start = undefined

      if (Math.abs(dx) >= minDistance && Math.abs(dx) > 2 * Math.abs(dy) && duration <= maxDuration) {
        onSwipeRef.current(dx < 0 ? 'left' : 'right')
      }
    }

    const onTouchCancel = () => {
      start = undefined
    }

    window.addEventListener('touchstart', onTouchStart, {passive: true})
    window.addEventListener('touchend', onTouchEnd, {passive: true})
    window.addEventListener('touchcancel', onTouchCancel, {passive: true})
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [])
}
