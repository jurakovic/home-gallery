import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSingleViewStore } from '../store/single-view-store'
import { useEditModeStore, ViewMode } from '../store/edit-mode-store'
import Hammer from 'hammerjs';

import { useLastLocation } from '../utils/lastLocation/useLastLocation'
import useBodyDimensions from '../utils/useBodyDimensions';
import { VirtualScroll, isFastScroll } from "./VirtualScroll";
import { getFilename, humanizeBytes, humanizeDuration } from "../utils/format";
import { getCoverPreviewSize, getHigherPreviewUrl } from '../utils/preview';
import { useThumbnailImage } from '../utils/useThumbnailImage';
import { classNames } from '../utils/class-names'

/**
 * File size of the main file of a media. Its value and its fraction with the
 * unit are two columns, so that the sizes of all rows are aligned at their
 * decimal point. It is empty for an unknown size
 */
const FileSize = ({item}) => {
  const size = item.files?.[0]?.size
  if (!size) {
    return null
  }

  const text = humanizeBytes(size)
  const dot = text.indexOf('.')

  return (
    <>
      <span className="w-10 text-right">{dot < 0 ? text : text.slice(0, dot)}</span>
      <span className="w-10">{dot < 0 ? '' : text.slice(dot)}</span>
    </>
  )
}

/**
 * Duration of a video as a badge of its thumbnail. It has the shape of the
 * media count badge of the album thumbnails, so that it still fits on the
 * smallest thumbnail size
 */
const DurationBadge = ({duration}) => (
  <span className="absolute px-1 text-xs text-gray-100 rounded bottom-1 right-1 bg-gray-900/70 group-hover:bg-gray-900"
    title="Duration of the video">
    {humanizeDuration(duration)}
  </span>
)

const Cell = ({height, width, index, item, items, labelHeight, isList, scrollSpeed}) => {
  const ref = useRef();
  const location = useLocation();
  const viewMode = useEditModeStore(state => state.viewMode);

  const selectedIdMap = useEditModeStore(state => state.selectedIds);
  const toggleId = useEditModeStore(store => store.toggleId);
  const toggleRange = useEditModeStore(store => store.toggleRange);
  const {id, shortId, previews, vibrantColors, type, duration } = item;
  const style = { height, width, backgroundColor: (vibrantColors && vibrantColors[1]) || 'inherited' }
  const navigate = useNavigate();

  const previewSize = getCoverPreviewSize(width, height, item.width, item.height);
  const previewUrl = getHigherPreviewUrl(previews, previewSize * (window.devicePixelRatio || 1));

  // The cell is unmounted with every query and every scroll, so its thumbnail
  // is kept in the memory of the browser for the next visit and a pending load
  // is aborted with the cell.
  //
  // A row of a fast scroll loads nothing at all: it is replaced within a few
  // frames and its request would only delay the rows the user stops at
  const imageProps = useThumbnailImage(previewUrl, isFastScroll(scrollSpeed));

  const showImage = () => {
    // the media view shrinks the page and the browser drops the scroll position
    // of the list, so it is remembered for the way back, see FluentList
    useSingleViewStore.getState().setListScroll(shortId, window.scrollY)
    navigate(`/view/${shortId}`, {state: {listLocation: location, index}});
  }

  const onClick = (selectRange) => {
    if (viewMode === ViewMode.EDIT) {
      if (selectRange) {
        toggleRange(id);
      } else {
        toggleId(id);
      }
    } else {
      showImage();
    }
  }

  const isSelected = () => {
    return viewMode === ViewMode.EDIT && selectedIdMap[id];
  }

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const hammer = new Hammer(element);
    let scrollYStart = 0;

    hammer.on('hammer.input', (e) => {
      if (e.isFirst) {
        scrollYStart = window.scrollY;
      }
    })
    hammer.on('tap press', (e) => {
      const scrollYDiff = Math.abs(scrollYStart - window.scrollY);
      if (scrollYDiff < 10) {
        const selectRange = (e.pointerType === "mouse" && e.srcEvent.shiftKey) || e.type === 'press';
        onClick(selectRange);
      }
    });

    return () => {
      if (!hammer) {
        return;
      }
      hammer.stop(false);
      hammer.destroy();
    }
  });

  // the label is no part of the media box, so that the thumbnail keeps its
  // size and the video duration stays in its corner
  const filename = (labelHeight || isList) ? getFilename(item) : ''

  // the thumbnail is rounded like the cover thumbnail of the albums page
  const thumbnail = (
    <div className={classNames('relative rounded', {'flex-shrink-0': isList, 'outline outline-4 outline-primary-300 outline-offset-[-0.25rem] brightness-110 saturate-[1.3]': isSelected()})} style={style}>
      {/* the virtual scroll renders the visible rows only and skips the rows of
          a fast scroll, so the thumbnail is loaded eagerly: a lazy load would
          defer even a cached file to the next frame and paint the cell blank
          until then. The cell keeps the vibrant color of its media until the
          preview is loaded */}
      <img {...imageProps} className={classNames('object-cover rounded')} style={style} />
      {type == 'video' &&
        <DurationBadge duration={duration} />
      }
    </div>
  )

  // the row of the list layout shows the file name beside the thumbnail
  if (isList) {
    return (
      <div ref={ref} key={id} className="flex items-center min-w-0 gap-4 pr-2 rounded group grow hover:bg-gray-700 hover:cursor-pointer" style={{height}}>
        {thumbnail}
        <span className="text-sm text-gray-400 truncate md:text-base grow group-hover:text-gray-300" title={filename}>
          {filename}
        </span>
        {/* the columns are dropped on a phone, where the file name needs the width */}
        <span className="flex-shrink-0 hidden w-20 text-sm text-gray-500 md:flex group-hover:text-gray-300">
          <FileSize item={item} />
        </span>
      </div>
    )
  }

  return (
    <div ref={ref} key={id} className="flex flex-col group hover:cursor-pointer" style={{width, height: height + labelHeight}}>
      {thumbnail}
      {!!labelHeight &&
        <span className="pt-1 text-xs text-gray-500 truncate group-hover:text-gray-300" style={{height: labelHeight}} title={filename}>
          {filename}
        </span>
      }
    </div>
  )
}

const Row = (props) => {
  const style = {
    gap: '8px',
    padding: '4px',
    height: props.height
  }
  const columns = props.columns;
  return (
    <div className="flex items-center w-full" style={style}>
      {columns.map((cell, index) => <Cell key={index} width={cell.width} height={cell.height} item={cell.item} index={cell.index} items={cell.items} labelHeight={props.labelHeight} isList={props.isList} scrollSpeed={props.scrollSpeed} />)}
    </div>
  )
}

const findCellById = (rows, id) => {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cell = rows[rowIndex]?.columns?.find(cell => cell.item.id.startsWith(id));
    if (cell) {
      return [cell, rowIndex]
    }
  }
  return [null, -1]
}

export const FluentList = ({rows, padding, labelHeight = 0, layout = 'fluent'}) => {
  const { width } = useBodyDimensions();

  const lastViewId = useSingleViewStore(state => state.lastId);
  const [lastRowIndex, setLastRowIndex] = useState(-1)

  const virtualScrollRef = useRef(null);

  useLayoutEffect(() => {
    if (!lastViewId) {
      return
    }
    const [cell, rowIndex] = findCellById(rows, lastViewId)
    if (cell && lastRowIndex != rowIndex) {
      console.log(`MediaFluent:useLayoutEffect scroll to ${lastViewId} in row ${rowIndex}`)
      // The list keeps its position if the media view is left with the media it
      // was opened with: the media is then where the user clicked it. Another
      // media of the media view is scrolled into the middle of the list instead
      const {listScrollId, listScrollTop} = useSingleViewStore.getState()
      const keepPosition = listScrollId == lastViewId
      virtualScrollRef.current.scrollToRow({rowIndex, scrollTop: keepPosition ? listScrollTop : -1});
      setLastRowIndex(rowIndex)
    } else if (!cell) {
      console.log(`MediaFluent:useLayoutEffect could not find entry with ${lastViewId}`)
    }
  }, [virtualScrollRef, rows, lastViewId])

  return (
    <div className="relative w-full">
      <VirtualScroll ref={virtualScrollRef} items={rows} padding={padding} >
        {({row, scrollSpeed}) => <Row height={row.height} columns={row.columns} labelHeight={labelHeight} isList={layout == 'list'} scrollSpeed={scrollSpeed}></Row>}
      </VirtualScroll>
    </div>
  )
}
