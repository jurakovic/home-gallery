import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Hammer from 'hammerjs'

import { getHigherPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { classNames } from "../utils/class-names";
import { useAppConfig } from "../config/useAppConfig";

export const MediaViewVideo = (props) => {
  const { media, dispatch, navVisible } = props
  const { previews } = media;
  const [isPlaying, setIsPlaying] = useState(false)
  const ref = useRef()
  const gestureOverlay = useRef()
  const previewSize = usePreviewSize()
  const appConfig = useAppConfig()
  const posterUrl = getHigherPreviewUrl(previews, previewSize) || ''
  // autoplay is enabled by default and needs to be disabled explicitly
  const autoPlay = appConfig.pages?.mediaView?.autoPlayVideo !== false

  const videoPreview = previews.filter(p => p.match(/video-preview/)).shift()
  const videoUrl = videoPreview ? `files/${videoPreview}` : ''
  const videoMime = videoPreview ? `video/${videoPreview.substring(videoPreview.lastIndexOf('.') + 1).toLowerCase()}` : 'video/mp4'

  useEffect(() => {
    const e: HTMLElement = ref.current;
    if (!e) {
      return
    }

    const onPause = () => {
      setIsPlaying(false)
      dispatch({type: 'pause'})
    }
    const onPlay = () => {
      setIsPlaying(true)
      dispatch({type: 'play'})
    }

    e.addEventListener('pause', onPause)
    e.addEventListener('play', onPlay)

    return () => {
      e.removeEventListener('pause', onPause)
      e.removeEventListener('play', onPlay)
    }
  }, [ref])

  useEffect(() => {
    const video: HTMLMediaElement = ref.current;
    const overlay: HTMLMediaElement = gestureOverlay.current;

    if (!overlay || !video) {
      return
    }

    const onSwipeHandler = (ev) => {
      ev.preventDefault()

      if (ev.direction === Hammer.DIRECTION_LEFT) {
        dispatch({type: 'next'})
      } else if (ev.direction === Hammer.DIRECTION_RIGHT) {
        dispatch({type: 'prev'})
      } else if (ev.direction === Hammer.DIRECTION_DOWN || ev.direction === Hammer.DIRECTION_UP) {
        dispatch({type: 'list'})
      }
    }

    const onTapHandler = (ev) => {
      if (!video.paused) {
        return
      }

      ev.preventDefault()

      setIsPlaying(true)
      video.play()
    }

    const mc = new Hammer.Manager(overlay)
    mc.add(new Hammer.Swipe())
    mc.add(new Hammer.Tap());

    mc.on("swipe", onSwipeHandler)
    mc.on("tap", onTapHandler)

    return () => {
      mc.stop(false)
      mc.destroy()
    }
  }, [ref, gestureOverlay])

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <video ref={ref} controls autoPlay={autoPlay} playsinline poster={posterUrl} className="w-full h-full">
          <source src={videoUrl} type={videoMime} />
          No native video element support. Watch video file from <a href={videoUrl}>here</a>
        </video>
        {/*
          The overlay catches the gestures of the media. It ends above the
          native video controls, so they stay reachable.

          A playing video keeps it while the navigation is hidden to allow a
          swipe to the previous or next media. Once the navigation is shown the
          overlay steps aside, so that the video itself is reachable again to
          pause it or to show its native controls
        */}
        <div ref={gestureOverlay} className={classNames('absolute top-0 left-0 right-0 bottom-14 md:bottom-18', {'hidden': isPlaying && navVisible})}></div>
      </div>
    </>
  )
}
