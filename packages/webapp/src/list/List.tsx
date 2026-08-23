import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";

import { useEntryStore } from "../store/entry-store";
import { useEditModeStore } from '../store/edit-mode-store';

import { FluentList } from "./FluentList";
import { NavBar } from "../navbar/NavBar";
import { Scrollbar } from "./scrollbar";

import useBodyDimensions from '../utils/useBodyDimensions';
import { useDeviceType, DeviceType } from "../utils/useDeviceType";
import { fluent } from "./fluent";
import { grid } from "./grid";
import { useThumbnailLayout, useThumbnailSize } from "./useThumbnailLayout";
import { useAppConfig } from "../config/useAppConfig";
import { MultiTagDialogProvider } from "../dialog/tag-dialog-provider";

const NAV_HEIGHT = 44
const BOTTOM_MARGIN = 4

const useViewHeight = (offset) => {
  const getHeight = () => (document.documentElement.clientHeight)+ offset
  const [height, setHeight] = useState(getHeight())

  const onResize = () => setHeight(getHeight())

  useEffect(() => {
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return height
}

const mobileRowHeights = {minHeight: 75, maxHeight: 110, maxPotraitHeight: 185}
const desktopRowHeights = {minHeight: 120, maxHeight: 200, maxPotraitHeight: 280}

const mobileGridSize = 110
const desktopGridSize = 180

/**
 * Height of the file name label below a thumbnail. It is the line height of
 * the text-xs label and its pt-1 padding
 */
const filenameLabelHeight = 20

const scaleRowHeights = ({minHeight, maxHeight, maxPotraitHeight}, factor: number) => ({
  minHeight: minHeight * factor,
  maxHeight: maxHeight * factor,
  maxPotraitHeight: maxPotraitHeight * factor
})

export const List = () => {
  const entries = useEntryStore(state => state.entries)

  const showSelected = useEditModeStore(state => state.showSelected);
  const selectedIds = useEditModeStore(state => state.selectedIds);

  const containerRef = useRef(window)

  const appConfig = useAppConfig();
  const showScrollbar = appConfig.pages?.list?.scrollbar !== false
  const showFilename = appConfig.pages?.list?.showFilename !== false
  // the label is part of the row height, so the layouts need to know it
  const labelHeight = showFilename ? filenameLabelHeight : 0

  const { width, height } = useBodyDimensions();
  const [ deviceType ] = useDeviceType();
  const [ layout ] = useThumbnailLayout();
  const [ , sizeFactor ] = useThumbnailSize();

  const viewHeight = height - NAV_HEIGHT - BOTTOM_MARGIN
  const padding = 8

  const visibleEntries = useMemo(() => {
    if (!showSelected) {
      return entries
    }
    return entries.filter(entry => selectedIds[entry.id])
  }, [showSelected, selectedIds, entries])

  const rows = useMemo(() => {
    const isMobile = deviceType === DeviceType.MOBILE
    if (layout == 'square') {
      const minSize = (isMobile ? mobileGridSize : desktopGridSize) * sizeFactor
      return grid(visibleEntries, {padding, width, minSize, labelHeight});
    }

    const rowHeights = scaleRowHeights(isMobile ? mobileRowHeights : desktopRowHeights, sizeFactor)
    return fluent(visibleEntries, {padding, width, ...rowHeights, labelHeight});
  }, [width, visibleEntries, deviceType, layout, sizeFactor, labelHeight])

  const topDateItems = useMemo(() => {
    return rows.map(({top, height, columns}) => ({top, height, date: columns[0].item?.date || '1970-01-01T00:00:00', dateValue: '1970'}))
  }, [rows])


  return (
    <>
      <MultiTagDialogProvider>
        <>
          <NavBar showList={true} />
          <div className="relative z-0">
            {showScrollbar && (
              <Scrollbar containerRef={containerRef}
                style={{marginTop: 0, marginBottom: BOTTOM_MARGIN}}
                pageHeight={viewHeight}
                topDateItems={topDateItems} />
            )}
            <FluentList rows={rows} padding={padding} labelHeight={labelHeight} />
          </div>
        </>
      </MultiTagDialogProvider>
    </>
  )
}