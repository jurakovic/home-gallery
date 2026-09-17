import * as React from "react";
import { useLayoutEffect } from "react";
import { useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { List } from './List';
import { useSearchStore } from '../store/search-store'
import { getDateFields } from '../utils/format'
import { classNames } from '../utils/class-names'
import { useHorizontalSwipe } from '../utils/useHorizontalSwipe'

/** Day of the year with a zero based month, like the fields of a date */
export type TMonthDay = {
  month: number
  day: number
}

/**
 * Year of the day math. It is a leap year, so that February 29 can be shown
 * and stepped over. The date is built in UTC, so that the local time zone and
 * its daylight saving switches do not shift the day
 */
const dayMathYear = 2000

const toDayDate = ({month, day}: TMonthDay) => new Date(Date.UTC(dayMathYear, month, day))

const isSameDay = (a: TMonthDay, b: TMonthDay) => a.month == b.month && a.day == b.day

/** Day before or after the given one, wrapping around the end of the year */
export const addDays = ({month, day}: TMonthDay, days: number): TMonthDay => {
  const date = toDayDate({month, day: day + days})
  return {month: date.getUTCMonth(), day: date.getUTCDate()}
}

const pad2 = (value: number) => ('' + value).padStart(2, '0')

export const toDayParam = ({month, day}: TMonthDay) => `${pad2(month + 1)}-${pad2(day)}`

/**
 * Day of the `day` search param in the form `MM-DD`. An invalid day like
 * `02-30` is ignored, so that the page falls back to the current day
 */
export const parseDayParam = (value: string | null): TMonthDay | undefined => {
  const match = value?.match(/^(\d{2})-(\d{2})$/)
  if (!match) {
    return
  }
  const monthDay = {month: +match[1] - 1, day: +match[2]}
  const date = toDayDate(monthDay)
  if (date.getUTCMonth() != monthDay.month || date.getUTCDate() != monthDay.day) {
    return
  }
  return monthDay
}

const formatDay = (monthDay: TMonthDay) => toDayDate(monthDay).toLocaleDateString(undefined, {month: 'long', day: 'numeric', timeZone: 'UTC'})

/**
 * Query of the media which were taken on the given day of an earlier year.
 *
 * Only the month and the day are matched, so the query holds for every year.
 * The current year is excluded, so that the page looks back only: the media of
 * today are the newest ones of the media lists already. The rule is the same
 * for every day, so that stepping through the days shows the same years
 *
 * The newest year comes first. Every media of the list shares its day, so the
 * date order keeps the media of a year together. The list itself draws no year
 * headings, the date scrollbar labels the years instead
 */
export const toOnThisDayQuery = (currentYear: number, {month, day}: TMonthDay) => {
  return `month:${month + 1} day:${day} year<${currentYear} order by date desc`
}

/**
 * Shape and colors of the buttons of the media view, see single/MediaNav.tsx.
 * The bar is no overlay of a media, so the buttons are not faded out, and they
 * keep their small mobile size on the desktop to keep the bar low
 */
const buttonClass = 'flex items-center justify-center rounded w-8 h-8 bg-gray-400/60 md:bg-gray-400/70 hover:bg-gray-400 hover:cursor-pointer'
const iconClass = 'text-gray-800'

/**
 * Switches the day of the page. A click on the day shows the current day, so
 * that the bar needs no extra button which would move the chevrons.
 *
 * The current day has no next day, so that the page does not show the media of
 * the coming days ahead of time. The next button is hidden and keeps its space,
 * so that the day and the previous button stay in place
 */
const DaySwitcher = ({monthDay, isToday, setDay}: {monthDay: TMonthDay, isToday: boolean, setDay: (monthDay?: TMonthDay) => void}) => (
  <div className="flex items-center justify-center gap-2 px-2 py-2">
    <button type="button" className={buttonClass} title="Previous day" aria-label="Previous day" onClick={() => setDay(addDays(monthDay, -1))}>
      <FontAwesomeIcon icon={icons.faChevronLeft} className={iconClass} />
    </button>
    <button type="button" disabled={isToday} title={isToday ? undefined : 'Show today'} onClick={() => setDay()}
      className={classNames('flex items-center justify-center h-8 min-w-32 px-2 rounded bg-gray-400/60 md:bg-gray-400/70', {
        'hover:bg-gray-400 hover:cursor-pointer': !isToday
      })}>
      <span className="text-sm text-gray-800 md:text-base">{formatDay(monthDay)}</span>
    </button>
    <button type="button" className={classNames(buttonClass, {invisible: isToday})} disabled={isToday} aria-hidden={isToday}
      title="Next day" aria-label="Next day" onClick={() => setDay(addDays(monthDay, 1))}>
      <FontAwesomeIcon icon={icons.faChevronRight} className={iconClass} />
    </button>
  </div>
)

/**
 * Media of a day of the earlier years.
 *
 * The page shows the current day unless the `day` search param names another
 * one. The current day is not written to the url, so that a bookmark or the
 * app shortcut of the page always shows the current day and not the day it was
 * saved on. The param keeps a picked day when the media view returns to the
 * list. On a touch screen a horizontal swipe changes the day as well.
 *
 * The day is read in the time zone of the database, so that today is the day of
 * the media which the gallery shows as today. Reading it in the other zone
 * showed the media of the neighbour day in the hours around midnight.
 */
export const OnThisDayView = () => {
  const search = useSearchStore(state => state.search);
  const [searchParams, setSearchParams] = useSearchParams()

  const {year, month, day} = getDateFields(new Date())
  const today = {month, day}
  const monthDay = parseDayParam(searchParams.get('day')) || today
  const isToday = isSameDay(monthDay, today)
  const query = toOnThisDayQuery(year, monthDay)

  useLayoutEffect(() => {
    search({type: 'query', value: query});
  }, [query])

  // stepping replaces the history entry like the view params of the albums
  // page, so that the back button leaves the page instead of walking back
  // through every day
  const setDay = (next?: TMonthDay) => setSearchParams(params => {
    if (!next || isSameDay(next, today)) {
      params.delete('day')
    } else {
      params.set('day', toDayParam(next))
    }
    return params
  }, {replace: true})

  // a swipe to the left shows the next day, like the next media of the media
  // view. The current day has no next day, like the hidden next button
  useHorizontalSwipe(direction => {
    if (direction == 'left' && isToday) {
      return
    }
    setDay(addDays(monthDay, direction == 'left' ? 1 : -1))
  })

  return (
    <>
      <List header={<DaySwitcher monthDay={monthDay} isToday={isToday} setDay={setDay} />} />
    </>
  )
}
