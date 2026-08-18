import { PointerEvent, useEffect, useRef, useState } from 'react'

/** Time without mouse movement until the navigation is hidden again */
const mouseIdleTimeout = 3000

/** Time after a tap until the navigation is hidden again */
const touchIdleTimeout = 5000

/** Maximum movement in px and duration in ms of a pointer to count as a tap */
const tapThreshold = 10
const tapTime = 500

/**
 * Time in ms and distance in px to the previous tap to belong to a double tap.
 * They match the double tap of Zoomable, which zooms the image: a tap that is
 * no double tap there has to toggle the navigation here
 */
const doubleTapInterval = 400
const doubleTapThreshold = 30

type TapStart = {
  x: number
  y: number
  time: number
  pointerType: string
  isControl: boolean
}

/**
 * Visibility of the media view navigation.
 *
 * The navigation is remembered while the media view is open. A swipe to the
 * previous or next media keeps it as it is and a clean tap or click toggles it.
 *
 * A playing video hides it to not cover the playback. The mouse reveals it by
 * moving, a tap toggles it and it hides again after a while. The remembered
 * visibility returns when the video pauses or is left.
 *
 * All gestures are read from the pointer events of the media view in the
 * capture phase. The native video controls and the Hammer gestures of the
 * media handle their events themselves and would swallow them otherwise
 */
export const useRevealNavigation = (isPlaying: boolean, isVideo: boolean) => {
  // the remembered visibility outside of a video playback
  const [visible, setVisible] = useState(true)
  // the temporary reveal while a video plays
  const [revealed, setRevealed] = useState(false)

  const revealTimer = useRef<any>(null)
  const tapTimer = useRef<any>(null)
  const tapStart = useRef<TapStart | null>(null)
  const lastTap = useRef({time: 0, x: 0, y: 0})
  // the timers fire late and need the values of that moment
  const revealedRef = useRef(false)
  const mediaRef = useRef({isPlaying, isVideo})
  mediaRef.current = {isPlaying, isVideo}

  const clearRevealTimer = () => {
    if (revealTimer.current) {
      clearTimeout(revealTimer.current)
      revealTimer.current = null
    }
  }

  const setRevealedState = (value: boolean) => {
    revealedRef.current = value
    setRevealed(value)
  }

  const hideReveal = () => {
    clearRevealTimer()
    setRevealedState(false)
  }

  const reveal = (timeout: number) => {
    clearRevealTimer()
    setRevealedState(true)
    revealTimer.current = setTimeout(() => setRevealedState(false), timeout)
  }

  const toggle = (start: TapStart) => {
    const {isPlaying, isVideo} = mediaRef.current

    if (start.isControl) {
      // a click on the navigation itself uses it and does not hide it
      return
    }

    if (isVideo && !isPlaying) {
      // the tap of a paused video starts its playback
      return
    } else if (!isPlaying) {
      setVisible(value => !value)
    } else if (start.pointerType != 'mouse') {
      revealedRef.current ? hideReveal() : reveal(touchIdleTimeout)
    }
    // a mouse reveals a playing video by moving. Its click pauses the video
  }

  const onPointerMove = (ev: PointerEvent) => {
    if (isPlaying && ev.pointerType == 'mouse') {
      reveal(mouseIdleTimeout)
    }
  }

  const onPointerLeave = (ev: PointerEvent) => {
    if (isPlaying && ev.pointerType == 'mouse') {
      hideReveal()
    }
  }

  const onPointerDownCapture = (ev: PointerEvent) => {
    // a second pointer belongs to a pinch and is no tap
    tapStart.current = !ev.isPrimary ? null : {
      x: ev.clientX,
      y: ev.clientY,
      time: Date.now(),
      pointerType: ev.pointerType,
      // the target is taken here since the click changes the media afterwards
      isControl: !!(ev.target as HTMLElement).closest?.('a, button')
    }
  }

  const onPointerCancelCapture = () => {
    tapStart.current = null
  }

  const onPointerUpCapture = (ev: PointerEvent) => {
    const start = tapStart.current
    tapStart.current = null

    // a swipe or a pan of a zoomed image is no tap and toggles nothing
    const now = Date.now()
    const isTap = !!start && ev.isPrimary &&
      Math.abs(ev.clientX - start.x) < tapThreshold &&
      Math.abs(ev.clientY - start.y) < tapThreshold &&
      now - start.time < tapTime
    if (!isTap) {
      return
    }

    clearTimeout(tapTimer.current)
    const isDoubleTap = now - lastTap.current.time < doubleTapInterval &&
      Math.abs(ev.clientX - lastTap.current.x) < doubleTapThreshold &&
      Math.abs(ev.clientY - lastTap.current.y) < doubleTapThreshold
    lastTap.current = {time: now, x: ev.clientX, y: ev.clientY}
    if (isDoubleTap) {
      // the double tap zooms the image and toggles nothing
      return
    }

    tapTimer.current = setTimeout(() => toggle(start), doubleTapInterval)
  }

  // the temporary reveal ends with the playback
  useEffect(() => {
    if (!isPlaying) {
      hideReveal()
    }
  }, [isPlaying])

  useEffect(() => () => {
    clearRevealTimer()
    clearTimeout(tapTimer.current)
  }, [])

  const handlers = {onPointerMove, onPointerLeave, onPointerDownCapture, onPointerUpCapture, onPointerCancelCapture}

  return {navVisible: isPlaying ? revealed : visible, handlers}
}
