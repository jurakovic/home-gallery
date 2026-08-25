import * as React from "react";
import {useRef, useEffect, useLayoutEffect, useState, useMemo, forwardRef, useImperativeHandle } from "react";

import { throttle } from '../utils/throttle';

export const useScrollTop = () => {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const scroll = () => {
      if (!ref.current) {
        ref.current = requestAnimationFrame(() => {
          ref.current = null;
          setScrollTop(document.documentElement.scrollTop);
        })
      }
    }
    window.addEventListener('scroll', scroll)

    // The state starts at the top while the browser keeps the scroll position
    // of the previous page. Reading the position after the mount catches up
    // with the browser, which has clamped it to the height of the new content
    // by now, so that the rendered rows match the viewport even if the page is
    // not scrolled afterwards
    setScrollTop(document.documentElement.scrollTop)

    return () => window.removeEventListener('scroll', scroll)
  }, []);

  return [scrollTop, setScrollTop];
}

export const useHeight = () => {
  const getHeight = () => window.innerHeight

  const [height, setHeight] = useState(getHeight());

  useLayoutEffect(() => {
    const updateHeight = () => {
      setHeight(getHeight())
    }
    setHeight(getHeight())
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight);
  }, [])

  return height;
}

export const useScrolling = () => {
  const [scrolling, setScrolling] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const scroll = (e) => {
      if (!ref.current) {
        setScrolling(true);
      } else {
        clearTimeout(ref.current);
      }
      ref.current = setTimeout(() => {
        setScrolling(false)
        ref.current = null;
      }, 200)
    }
    window.addEventListener('scroll', scroll)
    return () => window.removeEventListener('scroll', scroll)
  }, [])

  return scrolling;
}

export const useScrollSpeed = () => {
  const height = useHeight();
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const timerRef = useRef(null);
  const delay = 200;
  const timeout = 100;

  let lastScrollTop = document.documentElement.scrollTop;

  useEffect(() => {
    const scroll = throttle(() => {
      const scrollTop = document.documentElement.scrollTop;
      if (lastScrollTop != scrollTop) {
        const speed = (1000 / delay) * (scrollTop - lastScrollTop) / height;
        setScrollSpeed(+speed.toFixed(2));
      }
      lastScrollTop = scrollTop;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setScrollSpeed(0);
        timerRef.current = null;
      }, timeout);
    }, delay);
    window.addEventListener('scroll', scroll)
    return () => window.removeEventListener('scroll', scroll)
  }, [])

  return scrollSpeed;
}

/**
 * Scroll speed in view heights per second up to which a row loads its
 * previews.
 *
 * A faster scroll is a fling to another part of the list: its rows are mounted
 * for a few frames only and their requests would queue up in the browser, block
 * the previews of the rows the user stops at and keep loading long after the
 * scroll ended. Three view heights per second are still followed by the eye
 */
const maxLoadScrollSpeed = 3

/** True if the list scrolls too fast to load the previews of its rows */
export const isFastScroll = (scrollSpeed: number) => Math.abs(scrollSpeed) > maxLoadScrollSpeed

interface IVirtualScrollRow {
  top: number;
  height: number;
}

const binarySearch = (items: IVirtualScrollRow[], low: number, high: number, value: number) => {
  if (high - low < 2) {
    return low;
  }
  const mid = Math.floor(low + (high - low) / 2);
  if (items[mid].top > value) {
    return binarySearch(items, low, mid, value)
  }
  return binarySearch(items, mid, high, value);
}

export const VirtualScroll = ({ref, items, padding, children}) => {
  const [scrollTop, setScrollTop] = useScrollTop();
  const height = useHeight();
  const scrollSpeed = useScrollSpeed();
  const containerRef = useRef<HTMLDivElement>(null);

  const rowHeights: IVirtualScrollRow[] = useMemo(() => {
    let top = 0;
    return items.map(item => {
      const lastTop = top;
      top += item.height + padding;
      return Object.assign(item, { top: lastTop })
    })
  }, [height, items])

  const {start, end } = useMemo(() => {
    const start = binarySearch(rowHeights, 0, items.length, scrollTop);
    let end = start;
    while (end < items.length && rowHeights[end].top < scrollTop + height) {
      end++;
    }
    return {start, end}
    // the window height decides how many rows fill the viewport, so a resize
    // needs to widen the rendered range as well
  }, [items, scrollTop, height])

  const renderItems = useMemo(() => {
    const result = [];
    for (let index = Math.max(0, start - 2); index < Math.min(end + 5, items.length); index++) {
      const row = rowHeights[index];
      // the absolute position shrinks a row to its content, so the width is
      // set for rows which fill the list like the rows of the list layout
      const style = {
        position: 'absolute',
        top: row.top,
        width: '100%',
        height: row.height
      }
      result.push(<div className="item" key={index} style={style}>{children({row, index, scrollSpeed})}</div>)
    }
    return result;
    // the scroll speed decides whether a row loads its previews, so a change of
    // the speed has to reach the rows
  }, [start, end, items, scrollSpeed]);

  const lastRow = rowHeights[rowHeights.length - 1];
  const style = {
    position: 'relative',
    height: `${lastRow ? lastRow.top + lastRow.height : 0}px`
  } as React.CSSProperties;

  const scrollTo = (scrollToY: number) => {
    const y = Math.max(0, scrollToY)
    window.scrollTo(0, y);
    setScrollTop(y);
  }

  useImperativeHandle(ref, () => ({
    /**
     * Shows the row of the list.
     *
     * A `scrollTop` of zero or above is a remembered position of the list and
     * is restored as it is, which leaves the list exactly as the user left it.
     * The row is scrolled into the middle of the view otherwise
     */
    scrollToRow: ({rowIndex, scrollTop = -1}) => {
      if (!rowHeights.length || rowIndex < 0) {
        return;
      }
      if (scrollTop >= 0) {
        scrollTo(scrollTop);
        return;
      }

      const index = Math.min(rowIndex, rowHeights.length - 1);
      const row = rowHeights[index];
      // the rows are placed in the container, which starts below the nav bar
      const containerTop = containerRef.current ? containerRef.current.getBoundingClientRect().top + window.scrollY : 0
      scrollTo(containerTop + row.top + (row.height / 2) - (height / 2));
    }
  }));

  return (
    <div ref={containerRef} style={style}>
      {renderItems}
    </div>
  )
}
