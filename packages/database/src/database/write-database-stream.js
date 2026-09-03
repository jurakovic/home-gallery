import { Transform } from 'stream'
import { createGzip } from 'zlib'

import { through, compose, createAtomicWriteStream } from '@home-gallery/stream'
import Logger from '@home-gallery/logger'

import { getDatabaseFileType } from './migrate.js'

const log = Logger('database.writeStream')

/**
 * @param {string} filename
 * @param {object} [options]
 * @param {Date} [options.created]
 * @param {string} [options.timezone] Time zone of the media dates, see database.timezone
 * @returns {Promise<Transform[]>}
 */
export const createWriteStream = async (filename, {created = new Date(), timezone} = {}) => {
  const fileStream = await createAtomicWriteStream(filename)
  const databaseFileType = getDatabaseFileType()

  return compose(
    createStringifyEntry(databaseFileType, created, timezone),
    createGzip(),
    fileStream,
    new Transform({
      flush(cb) {
        log.debug(`Database written to ${filename}`)
        cb()
      }
    })
  )
}

/**
 * The header carries the time zone of the media dates, so that a reader knows
 * whether they are wall clocks or instants. A database without the property was
 * written before the setting and holds instants
 *
 * @param {Date} created
 * @param {string} [timezone] Time zone of the media dates, see database.timezone
 * @returns {Transform}
 */
export const createStringifyEntry = (databaseFileType, created = new Date(), timezone) => {
  let isFirstEntry = true

  const headerJson = JSON.stringify({
    type: databaseFileType.toString(),
    created: created.toISOString(),
    ...(timezone ? {timezone} : {}),
    data: []
  })

  const stream = through(function(entry, enc, cb) {
    let data = ''
    if (isFirstEntry) {
      data += headerJson.substring(0, headerJson.length - 2)
      isFirstEntry = false
    } else {
      data += ','
    }

    data += JSON.stringify(entry)
    cb(null, data)
  }, function(cb) {
    const data = isFirstEntry ? headerJson : "]}"
    cb(null, data)
  })

  return stream
}
