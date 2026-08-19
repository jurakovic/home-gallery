import { useCallback, useRef } from 'react';

import { useEntryStore } from '../store/entry-store'
import { mapEntriesForBrowser } from '../api/ApiService';
import { type Entry } from '../store/entry';

const THROTTLE_INTERVAL = 700

export const useOnEntries = () => {
  const addEntries = useEntryStore(state => state.addEntries);

  const entriesRef = useRef<Entry[]>([])
  const throttleTimerRef = useRef<any>(null)

  const flush = useCallback(() => {
    if (!entriesRef.current.length) {
      throttleTimerRef.current = null
      return
    }

    addEntries(entriesRef.current)
    entriesRef.current = []
    throttleTimerRef.current = setTimeout(flush, THROTTLE_INTERVAL)
  }, [])

  const onEntries = useCallback((newEntries: Entry[]) => {
    if (!newEntries.length) {
      return
    }

    for (const entry of newEntries) {
      entriesRef.current.push(mapEntriesForBrowser(entry))
    }

    if (throttleTimerRef.current) {
      return
    }

    flush()
  }, [])

  /**
   * Adds all pending entries at once. It is called when the initial database
   * load finished so that no throttled chunk arrives after the first render
   */
  const flushEntries = useCallback(() => {
    clearTimeout(throttleTimerRef.current)
    throttleTimerRef.current = null
    flush()
  }, [])

  return { onEntries, flushEntries }
}
