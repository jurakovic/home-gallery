import { useEffect } from 'react';

import { useEventStore } from '../store/event-store';

import { eventBus, fetchAll } from '../api/ApiService';

import { createOfflineDatabase } from '../offline';
import { useEntryStore } from '../store/entry-store';
import { toNativeFactory } from '../utils/to-worker';
import { useAppConfig } from '../config/useAppConfig';
import { useOnEntries } from './useOnEntries';
import { toAbsoluteUrl } from '../utils/toAbsoluteUrl';

/**
 * Paint the entries even if the initial database load did not finish yet. A
 * large or slow library should not stare at an empty list forever
 */
const INITIAL_LOAD_TIMEOUT = 2 * 1000

export const useLoadDatabase = () => {
  const removeEntries = useEntryStore(state => state.removeEntries);
  const setInitialLoadDone = useEntryStore(state => state.setInitialLoadDone);
  const reapplyEvents = useEventStore(state => state.reapplyEvents);
  const appConfig = useAppConfig()
  const { onEntries, flushEntries } = useOnEntries()

  useEffect(() => {
    const initialLoadTimer = setTimeout(setInitialLoadDone, INITIAL_LOAD_TIMEOUT)

    /**
     * Called when a database load settled. The pending entries are added at
     * once so that no throttled chunk re-orders the list after its first render
     */
    const onLoadDone = () => {
      clearTimeout(initialLoadTimer)
      flushEntries()
      reapplyEvents()
      setInitialLoadDone()
    }

    onEntries(appConfig.entries as [] || [])

    if (appConfig.disabled?.includes('database')) {
      onLoadDone()
      return
    }

    const onDatabaseReloaded = cb => {
      eventBus.addEventListener('server', event => {
        if (event.action === 'databaseReloaded') {
          console.log(`Reload database due server event`)
          cb()
        }
      })
    }

    const loadOfflineDatabase = async () => {
      console.log(`Use offline database for entries`)
      const handlers = {
        onEntries,
        onRemoveEntries: removeEntries
      }
      const baseUrl = toAbsoluteUrl()
      const args = [baseUrl, 5000]
      const offlineDb = toNativeFactory('offlineDatabase', createOfflineDatabase, args, handlers)
      await offlineDb('open')
      await offlineDb('sync')

      onLoadDone()
      onDatabaseReloaded(async () => {
        console.log(`Reload offline database from server`)
        await offlineDb('sync')
        onLoadDone()
      })
    }

    const loadLegacyDatabase = async () => {
      console.log(`Use paged database requests for entries`)
      const chunkLimits = [1000, 2000, 4000, 8000, 16000, 32000]

      async function run() {
        console.log(`Loading database from server`)
        return fetchAll(chunkLimits, onEntries)
          .catch(err => {
            console.log(`Failed to load database: ${err}`, err)
          })
          .finally(() => onLoadDone())
      }

      onDatabaseReloaded(run)
      return run()
    }


    if (appConfig.disabled?.includes('offlineDatabase')) {
      console.log('Feature offline database is disabled')
      loadLegacyDatabase()
    } else {
      loadOfflineDatabase()
        .catch(err => {
          console.log(`Failed to load entries via offline database: ${err}. Use fallback`, err)
          loadLegacyDatabase()
        })
    }

    return () => clearTimeout(initialLoadTimer)
  }, []);
}