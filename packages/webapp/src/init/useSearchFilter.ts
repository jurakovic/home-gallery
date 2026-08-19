import { useEffect, useRef } from 'react'
import { useLogger, usePluginManager } from '../AppContext'
import { useEntryStore } from '../store/entry-store'
import type { TQueryContext } from '@home-gallery/types'
import { stringifyEntry } from '@home-gallery/query'
import { useSearchStore } from '../store/search-store'
import { findAllEntriesByIdPrefix } from '../utils/findAllEntriesByIdPrefix'
import { type Entry } from '../store/entry'

/**
 * Collapse a burst of entry updates into a single query run. Live updates like
 * tagging or a reloaded server database arrive in chunks and each run would
 * re-order the whole list
 */
const ENTRY_UPDATE_DEBOUNCE = 200

/**
 * Bind entry store and search store with plugin manager and its executeQuery()
 */
export const useSearchFilter = () => {
  const allEntries = useEntryStore(state => state.allEntries)
  const setEntries = useEntryStore(state => state.setEntries)
  const initialLoadDone = useEntryStore(state => state.initialLoadDone)
  const query = useSearchStore(state => state.query)
  const manager = usePluginManager()
  const log = useLogger('SearchFilter')

  const lastQuery = useRef(query)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!initialLoadDone) {
      // The database is written by date desc and is loaded in chunks. Running
      // the query on every chunk would paint the list in source order first and
      // re-order it visibly once the remaining chunks arrive
      return
    }

    const isQueryChange = lastQuery.current != query
    lastQuery.current = query
    // Answer the first run and every query change instantly. Only further entry
    // updates are debounced
    const delay = !hasRun.current || isQueryChange ? 0 : ENTRY_UPDATE_DEBOUNCE

    let isStale = false
    const timer = setTimeout(() => {
      hasRun.current = true
      const databaseApi = createDatabaseApi(allEntries)

      run(databaseApi, query, manager, log)
        .then(entries => {
          if (!isStale) {
            setEntries(entries)
          }
        })
    }, delay)

    return () => {
      isStale = true
      clearTimeout(timer)
    }
  }, [allEntries, query, initialLoadDone])

}

const run = async (databaseApi, query, manager, log) => {
  const queryContext: TQueryContext = createQueryContext(databaseApi, log)

  let term = ''
  switch (query.type) {
    case 'none': term = ''; break
    case 'query': term = query.value || ''; ; break
    case 'year': term = query.query || ''; queryContext.plugin.year = { value: query.value }; break
    case 'similar': term = query.query || ''; queryContext.plugin.similar = { seedId: query.value }; break
    case 'faces': term = query.query || ''; queryContext.plugin.face = { id: `${query.value.id}.${query.value.faceIndex}` }; break
    default:
      log.warn(`Search type ${query.type} NYI`)
      break
  }

  return manager.executeQuery(databaseApi.entries.findAll(), term, queryContext)
}

function createQueryContext(databaseApi, log): TQueryContext {
  return {
    textFn(entry) {
      return stringifyEntry(entry)
    },
    queryErrorHandler(ast, context, reason) {
      log.warn(ast, `Unhandled query ast ${ast.type}: ${reason}. Skip it`)
      return true
    },
    plugin: {
      database: databaseApi
    }
  }
}

type TQueryDatabaseApi = {
  entries: TQueryEntryApi
}

type TQueryEntryApi = {
  findAll: () => Entry[]
  findAllByIdPrefix: (idPrefix: string) => Entry[]
}

function createDatabaseApi(allEntries: Entry[]): TQueryDatabaseApi {
  return {
    entries: {
      findAll() {
        return allEntries
      },
      findAllByIdPrefix(idPrefix: string) {
        if (!idPrefix) {
          return []
        }
        return findAllEntriesByIdPrefix(allEntries, idPrefix)
      }
    }
  }
}
