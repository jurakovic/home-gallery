import * as React from "react";
import { useLayoutEffect } from "react";

import { List } from './List';
import { useSearchStore } from '../store/search-store'

/**
 * Query of the media which were taken on the same day of an earlier year.
 *
 * Only the month and the day are matched, so the query holds for every year.
 * The current year is excluded, so that the page looks back only: the media of
 * today are the newest ones of the media lists already.
 *
 * The day is read in the local time zone, which is the day the user calls today
 * and the day the app prints below its media, see utils/format.ts. Reading it in
 * UTC showed the previous day to everyone east of UTC in the hours after
 * midnight, and the next day west of it in the hours before.
 *
 * The date of an entry is stored in UTC, see packages/database/src/media/date.js,
 * and the year, month and day filters slice that UTC string, so a media taken in
 * the hours around midnight is matched on its neighbour day. Its local hour is
 * lost with the time zone offset of the entry date, so the query cannot correct
 * that shift.
 *
 * The newest year comes first. Every media of the list shares its day, so the
 * date order keeps the media of a year together. The list itself draws no year
 * headings, the date scrollbar labels the years instead
 */
export const toOnThisDayQuery = (today: Date) =>
  `month:${today.getMonth() + 1} day:${today.getDate()} year<${today.getFullYear()} order by date desc`

/**
 * Media of the current day of the earlier years.
 *
 * The day is resolved on every mount instead of being part of the url, so that
 * a bookmark or the app shortcut of the page always shows the current day and
 * not the day it was saved on
 */
export const OnThisDayView = () => {
  const search = useSearchStore(state => state.search);

  useLayoutEffect(() => {
    search({type: 'query', value: toOnThisDayQuery(new Date())});
  }, [])

  return (
    <>
      <List />
    </>
  )
}
