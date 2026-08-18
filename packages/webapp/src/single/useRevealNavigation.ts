import { PointerEvent, useEffect, useRef, useState } from 'react'

/** Time without mouse movement until the navigation is hidden again */
const mouseIdleTimeout = 3000

/** Time after a tap until the navigation is hidden again */
const touchIdleTimeout = 5000

/**
 * Reveals the hidden navigation of the media view without pausing the video.
 *
 * The navigation is hidden while a video plays. The mouse reveals it and it
 * hides again after a while without movement, otherwise it would cover the
 * video for the whole playback. A tap toggles it on touch devices.
 *
 * The taps are taken in the capture phase since the native video controls
 * handle the tap themselves and it would not reach the media view otherwise
 */
export const useRevealNavigation = (isHidden: boolean) => {
  const [revealed, setRevealed] = useState(false)
  const timer = useRef<any>(null)
  // the handlers are called from events and need the current value
  const revealedRef = useRef(false)

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const setRevealedState = (value: boolean) => {
    revealedRef.current = value
    setRevealed(value)
  }

  const hide = () => {
    clearTimer()
    setRevealedState(false)
  }

  const reveal = (timeout: number) => {
    clearTimer()
    setRevealedState(true)
    timer.current = setTimeout(() => setRevealedState(false), timeout)
  }

  const onPointerMove = (ev: PointerEvent) => {
    if (ev.pointerType == 'mouse') {
      reveal(mouseIdleTimeout)
    }
  }

  const onPointerLeave = (ev: PointerEvent) => {
    if (ev.pointerType == 'mouse') {
      hide()
    }
  }

  const onPointerDownCapture = (ev: PointerEvent) => {
    if (ev.pointerType == 'mouse') {
      return
    }
    // the navigation buttons are removed on hide and would miss their click
    const isNavigation = (ev.target as HTMLElement).closest?.('a, button')
    if (!isNavigation && revealedRef.current) {
      hide()
    } else {
      reveal(touchIdleTimeout)
    }
  }

  // the navigation is shown again by itself when the video pauses
  useEffect(() => {
    if (!isHidden) {
      hide()
    }
  }, [isHidden])

  useEffect(() => clearTimer, [])

  // the navigation is visible anyway if it is not hidden
  const handlers = isHidden ? {onPointerMove, onPointerLeave, onPointerDownCapture} : {}

  return {revealed, handlers}
}
