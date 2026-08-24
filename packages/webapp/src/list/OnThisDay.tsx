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
 * The date of an entry is stored in UTC, see packages/database/src/media/date.js,
 * and the year, month and day filters slice that UTC string. The day is read in
 * UTC as well, otherwise the media of the hours around midnight would fall on
 * the neighbour day of every user who is not on UTC.
 *
 * The newest year comes first. Every media of the list shares its day, so the
 * date order keeps the media of a year together. The list itself draws no year
 * headings, the date scrollbar labels the years instead
 */
export const toOnThisDayQuery = (today: Date) =>
  `month:${today.getUTCMonth() + 1} day:${today.getUTCDate()} year<${today.getUTCFullYear()} order by date desc`

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
