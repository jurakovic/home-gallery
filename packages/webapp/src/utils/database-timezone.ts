/**
 * Time zone of the media dates of the database, see the database.timezone config
 * of the gallery.
 *
 * The dates of a 'local' database are wall clocks without an offset, eg
 * '2004-10-19T10:34:17'. Read by the local getters of a Date they return that
 * very clock on every device, which is the time the gallery shows and the time
 * its date filters match, since those slice the stored date.
 *
 * The dates of a 'utc' database are instants, eg '2004-10-19T08:34:17.000Z', and
 * are shown in UTC to match the same filters.
 *
 * A database of a gallery before the setting carries no time zone. Its dates are
 * instants like the 'utc' ones but are shown in the time zone of the browser,
 * which is what these galleries have always shown
 */
const UTC = 'utc'

/**
 * The time zone reaches the browser with the injected app state and with the
 * header of the database chunks. The state is the earlier one and is also the
 * only one of the two which the offline database sees
 */
const injectedTimezone = typeof window != 'undefined' ? window['__homeGallery']?.timezone : undefined

let utcDates = injectedTimezone == UTC

export const setDatabaseTimezone = (timezone?: string) => {
  utcDates = timezone == UTC
}

/**
 * True if the media dates are to be read in UTC
 */
export const isUtcDates = () => utcDates
