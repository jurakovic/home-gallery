import t from 'tap'

import { getEntryDate, getTimezone, toFileDate, LOCAL, UTC } from './date.js'

const toEntry = (DateTimeOriginal) => ({type: 'image', meta: {exif: {DateTimeOriginal}}})

t.test('date', async t => {
  t.test('getTimezone', async t => {
    t.equal(getTimezone({}), LOCAL, 'Local time zone is the default')
    t.equal(getTimezone({database: {timezone: 'utc'}}), UTC, 'Read utc from the config')
    t.equal(getTimezone({database: {timezone: 'unknown'}}), LOCAL, 'Fall back to the local time zone')
  })

  t.test('local time zone', async t => {
    const entry = toEntry({rawValue: '2004:10:19 10:34:17', tzoffsetMinutes: 120})

    t.equal(getEntryDate(entry, LOCAL), '2004-10-19T10:34:17', 'Keep the wall clock of the camera')
  })

  t.test('local time zone of a raw value with an offset', async t => {
    const entry = toEntry({rawValue: '2004:10:19 10:34:17+02:00'})

    t.equal(getEntryDate(entry, LOCAL), '2004-10-19T10:34:17', 'Drop the offset of the wall clock')
  })

  t.test('utc time zone', async t => {
    const entry = toEntry({rawValue: '2004:10:19 10:34:17', tzoffsetMinutes: 120})

    t.equal(getEntryDate(entry, UTC), '2004-10-19T08:34:17.000Z', 'Convert the wall clock to its instant')
  })

  t.test('utc time zone of a half hour offset', async t => {
    const entry = toEntry({rawValue: '2004:10:19 10:34:17', tzoffsetMinutes: 330})

    t.equal(getEntryDate(entry, UTC), '2004-10-19T05:04:17.000Z', 'Subtract hours and minutes of the offset')
  })

  t.test('utc time zone without an offset', async t => {
    const entry = toEntry('2004:10:19 10:34:17')

    t.equal(getEntryDate(entry, UTC), '2004-10-19T10:34:17.000Z', 'Take the wall clock as UTC, not as the time of the host')
  })

  t.test('local time zone prefers the clock of the camera', async t => {
    const entry = {type: 'image', meta: {exif: {
      GPSDateTime: {rawValue: '2004:10:19 08:34:17Z'},
      DateTimeOriginal: {rawValue: '2004:10:19 10:34:17'},
    }}}

    t.equal(getEntryDate(entry, LOCAL), '2004-10-19T10:34:17', 'Skip the UTC clock of GPSDateTime')
    t.equal(getEntryDate(entry, UTC), '2004-10-19T08:34:17.000Z', 'Prefer the instant of GPSDateTime')
  })

  t.test('empty date', async t => {
    const entry = toEntry({rawValue: '0000:00:00 00:00:00'})

    t.equal(getEntryDate(entry, LOCAL), false, 'An empty date has no date')
  })

  t.test('toFileDate', async t => {
    t.equal(toFileDate('2021-01-02T03:04:05.000Z', UTC), '2021-01-02T03:04:05.000Z', 'Keep the instant of the file date')
    t.match(toFileDate('2021-01-02T03:04:05.000Z', LOCAL), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Render the file date as wall clock of the host')
    t.equal(toFileDate(false, LOCAL), false, 'Keep a missing file date')
  })
})
