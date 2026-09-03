import { useState, useEffect } from 'react';

import { throttle } from './throttle';

function getBodyDimensions() {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  return {
    width,
    height
  };
}

const hasResizeObserver = typeof ResizeObserver === 'function'

/** Dimensions of the viewport without its scrollbars */
export default function useBodyDimensions() {
  const [bodyDimensions, setBodyDimensions] = useState(getBodyDimensions());

  useEffect(() => {
    const update = () => setBodyDimensions(prev => {
      const next = getBodyDimensions()
      return prev.width == next.width && prev.height == next.height ? prev : next
    })

    const resizeHandler = throttle(update, 100);

    update();
    window.addEventListener('resize', resizeHandler);

    // an appearing scrollbar narrows the viewport without a resize event, but
    // it shrinks the root element. The observer is unthrottled, so that the
    // layouts are corrected before they are painted
    const observer = hasResizeObserver ? new ResizeObserver(update) : null
    observer?.observe(document.documentElement)

    return () => {
      window.removeEventListener('resize', resizeHandler);
      observer?.disconnect()
    }
  }, []);

  return bodyDimensions;
}
