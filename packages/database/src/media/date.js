import { getMetaEntries } from './utils.js'

import Logger from '@home-gallery/logger'

const log = Logger('database.media.date')

/**
 * Time zone of the media dates of the database, see the database.timezone config.
 *
 * 'local' keeps the wall clock of the camera, eg '2004-10-19T10:34:17'. The
 * date carries no offset, so every device reads back the day and the hour the
 * media was taken at and the date filters of a query match that same clock.
 *
 * 'utc' converts the wall clock to the instant it happened at, eg
 * '2004-10-19T08:34:17Z'
 */
export const LOCAL = 'local'
export const UTC = 'utc'

/**
 * Time zone of the database of the given gallery config
 */
export const getTimezone = config => config?.database?.timezone == UTC ? UTC : LOCAL

const pad2 = value => `${value}`.padStart(2, '0')

/**
 * Wall clock of an instant in the time zone of the current host
 */
const toWallClock = date => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`

/**
 * Time zone offset of an exiftool date as '+02:00', '' if it has none.
 *
 * The offset of the raw value wins over the offset which exiftool derived from
 * other tags like the GPS position
 */
function getDateOffset(date, match) {
  if (match[8]) {
    return match[8]
  } else if (!date.tzoffsetMinutes) {
    return ''
  }

  const offset = Math.abs(date.tzoffsetMinutes)
  const hour = '' + Math.floor(offset / 60)
  const minute = '' + (offset % 60)
  return (date.tzoffsetMinutes < 0 ? '-' : '+') + hour.padStart(2, '0') + ':' + minute.padStart(2, '0')
}

// '0000:00:00 00:00:00' => false
// {tzoffsetMinutes: 120, rawValue: '2004:10:19 10:34:17'} => '2004-10-19T10:34:17' (local) or '2004-10-19T08:34:17.000Z' (utc)
function parseExiftoolDate(entry, date, timezone) {
  let value = date?.rawValue ? date.rawValue : date
  if (typeof value !== 'string' || value.length < 10 || value.startsWith('0000')) {
    return false
  }

  const match = value.match(/(\d{4}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).(\d{2})(\.\d+)?(([-+](\d{2}:\d{2}|\d{4}))|Z)?\s*$/)
  if (!match) {
    log.warn(`Unknown time format ${value} of ${JSON.stringify(date)} of entry ${entry}`)
    return false
  }

  const wallClock = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${match[7] ? match[7] : ''}`
  if (isNaN(new Date(`${wallClock}Z`).getTime())) {
    log.error(`Could not create valid ISO8601 date '${wallClock}' from '${JSON.stringify(date)}' of entry ${entry}`)
    return false
  }

  if (timezone == LOCAL) {
    return wallClock
  }

  // A wall clock without any offset is taken as UTC. Reading it as the local
  // time of the host would tie the database to the time zone of the machine
  // which built it
  const iso8601 = wallClock + (getDateOffset(date, match) || 'Z')
  try {
    return new Date(iso8601).toISOString()
  } catch(e) {
    log.error(`Could not create valid ISO8601 date '${iso8601}' from '${JSON.stringify(date)}' of entry ${entry}: ${e}`)
    return false
  }
}

/**
 * GPSDateTime is the most exact instant of a media and leads the keys of the utc
 * time zone. Its clock is the UTC one, not the one of the camera, so the local
 * time zone reads it as its last resort only
 */
const utcDateKeys = ['GPSDateTime', 'SubSecDateTimeOriginal', 'DateTimeOriginal', 'CreateDate']
const localDateKeys = ['SubSecDateTimeOriginal', 'DateTimeOriginal', 'CreateDate', 'GPSDateTime']

function getExifDate(entry, timezone) {
  const exif = entry.meta?.exif
  if (!exif) {
    return false
  }
  const dateKeys = timezone == LOCAL ? localDateKeys : utcDateKeys
  return dateKeys.reduce((date, key) => date || parseExiftoolDate(entry, exif[key], timezone), false)
}

export function getEntryDate(entry, timezone = LOCAL) {
  const metaEntries = getMetaEntries(entry)
  const metaDate = metaEntries.reduce((date, entry) => date || getExifDate(entry, timezone), false)
  if (metaDate) {
    return metaDate
  }

  const allEntries = [entry, ...(entry.sidecars || [])]
  return allEntries.reduce((date, entry) => date || getExifDate(entry, timezone), false)
}

/**
 * Date of the file as fallback for media without any media date.
 *
 * The file date is an instant, so the local time zone renders it by the host
 * which builds the database. There is no better zone: the file system keeps
 * none and the media brought no meta data
 */
export function toFileDate(date, timezone = LOCAL) {
  if (!date) {
    return date
  }
  const instant = new Date(date)
  if (isNaN(instant.getTime())) {
    return date
  }
  return timezone == LOCAL ? toWallClock(instant) : instant.toISOString()
}
