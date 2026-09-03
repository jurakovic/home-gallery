import { isUtcDates } from './database-timezone'

/**
 * File name of the main file of a media without its directory. The media
 * lists, the media view and the details view show the same name
 */
export const getFilename = entry => (entry?.files?.[0]?.filename || '').replace(/.*[\\/]/, '')

export const humanizeDuration = duration => {
  const hours = duration / 3600
  const min = '' + Math.floor((duration % 3600) / 60)
  const sec = (duration % 60).toFixed()
  if (hours > 1) {
    return `${Math.floor(hours)}:${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
  }
  return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
}

const pad2 = (v : number | string) => ('' + v).padStart(2, '0')

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Fields of a media date, read in the time zone of the database. The local
 * getters return the wall clock of a date without an offset unchanged, see
 * utils/database-timezone.ts
 */
export const getDateFields = (date: Date) => isUtcDates() ? {
  year: date.getUTCFullYear(),
  month: date.getUTCMonth(),
  day: date.getUTCDate(),
  weekDay: date.getUTCDay(),
  hour: date.getUTCHours(),
  minute: date.getUTCMinutes(),
  second: date.getUTCSeconds(),
} : {
  year: date.getFullYear(),
  month: date.getMonth(),
  day: date.getDate(),
  weekDay: date.getDay(),
  hour: date.getHours(),
  minute: date.getMinutes(),
  second: date.getSeconds(),
}

export const formatDate = (format, date) => {
  if (!date) {
    return 'Unkown'
  }
  const d = getDateFields(new Date(date))
  return format.replace(/%([YymbdHIlPpMSaA])/g, (_, code) => {
    switch (code) {
      case 'Y': return '' + d.year
      case 'y': return ('' + d.year).substring(2, 4)
      case 'm': return pad2(d.month + 1)
      case 'b': return shortMonths[d.month]
      case 'd': return pad2(d.day)
      case 'H': return pad2(d.hour)
      case 'I': return pad2(d.hour % 12 || 12)
      case 'l': return '' + (d.hour % 12 || 12) 
      case 'P': return d.hour >= 12 ? 'pm' : 'am'
      case 'p': return d.hour >= 12 ? 'PM' : 'AM'
      case 'M': return pad2(d.minute)
      case 'S': return pad2(d.second)
      case 'a': return shortWeekDays[d.weekDay]
      case 'A': return weekDays[d.weekDay]
      default: return ''
    }
  })
}

export const humanizeBytes = bytes => {
  const units = ['', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  while (bytes > 786 && unitIndex < units.length - 1) {
    unitIndex++
    bytes /= 1024
  }
  return `${bytes.toFixed(1)}${units[unitIndex]}`
}
