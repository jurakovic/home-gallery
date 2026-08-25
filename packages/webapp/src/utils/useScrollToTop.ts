import { useLayoutEffect } from 'react'

/**
 * Starts a page at the top.
 *
 * A route change keeps the scroll position of the browser, so a page which is
 * opened from a scrolled media list would start in the middle of its content.
 * The media lists are reset by their query change, see useSearchFilter, the
 * pages without a query by this hook.
 *
 * It scrolls in a layout effect, so that the page is painted at the top and
 * the virtual scroll of the page reads the reset position, see VirtualScroll
 */
export const useScrollToTop = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
}
