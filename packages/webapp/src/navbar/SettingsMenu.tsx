import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { classNames } from "../utils/class-names";
import { orderKeys } from "../utils/orderQuery";
import {
  maxSizeStep,
  minSizeStep,
  thumbnailLayouts,
  toSizeStepName,
  useThumbnailLayout,
  useThumbnailSize,
  type TThumbnailSize,
} from "../list/useThumbnailLayout";
import { useFolderOrder, useFolderThumbnailSize, useFolderView, useResetFolderParams } from "../folders/useFoldersView";
import { resetViewSettings } from "../store/view-settings";
import { NavItem } from "./NavItem";
import { Popover } from "./Popover";
import { useOrder } from "./useOrder";

const directionIcon = (direction: string) => direction == 'asc' ? icons.faArrowUpShortWide : icons.faArrowDownWideShort

const layoutIcons = {
  fluent: icons.faImages,
  grid: icons.faTableCellsLarge,
  list: icons.faList,
}

const layoutNames = {
  fluent: 'Fluent',
  grid: 'Grid',
  list: 'List',
}

/** Section of the panel with its title */
const Section = ({title, children}) => (
  <div className="py-1 border-t border-gray-700 first:border-t-0">
    <p className="px-3 py-1 text-xs tracking-wide text-gray-600 uppercase">{title}</p>
    {children}
  </div>
)

/** Row of a section which shows whether it is the current value */
const Option = ({name, isCurrent, onClick, title, icon = null, children = null}) => (
  <a className={classNames('flex items-center justify-between gap-4 px-3 py-2 hover:bg-gray-700 hover:cursor-pointer', {
      'text-gray-300': isCurrent,
      'text-gray-500 hover:text-gray-300': !isCurrent})}
    onClick={onClick}
    title={title}>
    <span className="flex items-center gap-2 whitespace-nowrap">
      { icon &&
        <FontAwesomeIcon icon={icon} className="w-4 text-center" />
      }
      {name}
    </span>
    {children}
  </a>
)

/** Order of the media lists. Picking the current key toggles its direction */
const OrderSection = ({close}: {close: () => void}) => {
  const [order, applyKey] = useOrder()

  return (
    <Section title="Order by">
      { orderKeys.map(orderKey => {
        const isCurrent = orderKey.key == order.key
        return (
          <Option key={orderKey.key} name={orderKey.name} isCurrent={isCurrent}
            onClick={() => { applyKey(orderKey.key); close() }}
            title={isCurrent && orderKey.defaultDirection ? 'Toggle the order direction' : `Order by ${orderKey.name}`}>
            { isCurrent && order.direction &&
              <FontAwesomeIcon icon={directionIcon(order.direction)} />
            }
          </Option>
        )
      })}
    </Section>
  )
}

/** Thumbnail layout of the media lists */
const LayoutSection = () => {
  const [layout, setLayout] = useThumbnailLayout()

  return (
    <Section title="Layout">
      { thumbnailLayouts.map(name => (
        <Option key={name} name={layoutNames[name]} icon={layoutIcons[name]} isCurrent={name == layout}
          onClick={() => setLayout(name)}
          title={`Show the media in the ${layoutNames[name].toLowerCase()} layout`} />
      ))}
    </Section>
  )
}

/** Name order of the folders page. It has one key, so it toggles its direction */
const FolderOrderSection = () => {
  const [descending, setDescending] = useFolderOrder()

  return (
    <Section title="Order by">
      <Option name="Name" isCurrent={true}
        onClick={() => setDescending(!descending)}
        title="Toggle the order direction">
        <FontAwesomeIcon icon={directionIcon(descending ? 'desc' : 'asc')} />
      </Option>
    </Section>
  )
}

/** View of the folders page */
const FolderViewSection = () => {
  const [isGrid, setView] = useFolderView()

  return (
    <Section title="View">
      <Option name="List" icon={icons.faList} isCurrent={!isGrid}
        onClick={() => setView('list')}
        title="Show the folder tree" />
      <Option name="Grid" icon={icons.faTableCellsLarge} isCurrent={isGrid}
        onClick={() => setView('grid')}
        title="Show the folders as squared cover thumbnails" />
    </Section>
  )
}

const SizeButton = ({icon, disabled, onClick, title}) => (
  <a className={classNames('flex items-center justify-center w-8 h-8 rounded', {
      'text-gray-500 hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer active:bg-gray-600 active:text-gray-200': !disabled,
      'text-gray-700 hover:cursor-not-allowed': disabled})}
    onClick={() => !disabled && onClick()}
    title={title}>
    <FontAwesomeIcon icon={icon} />
  </a>
)

/**
 * Thumbnail size of the page. The panel stays open, so that the size can be
 * changed step by step while the page behind it follows
 */
const SizeSection = ({size}: {size: TThumbnailSize}) => {
  const [sizeStep, , setSizeStep] = size

  const canShrink = sizeStep > minSizeStep
  const canGrow = sizeStep < maxSizeStep

  return (
    <Section title="Thumbnail size">
      <div className="flex items-center justify-between gap-4 px-3 py-1">
        <span className="text-gray-300 whitespace-nowrap">{toSizeStepName(sizeStep)}</span>
        <span className="flex gap-1">
          <SizeButton icon={icons.faMagnifyingGlassMinus} disabled={!canShrink}
            onClick={() => setSizeStep(sizeStep - 1)}
            title="Smaller thumbnails" />
          <SizeButton icon={icons.faMagnifyingGlassPlus} disabled={!canGrow}
            onClick={() => setSizeStep(sizeStep + 1)}
            title="Larger thumbnails" />
        </span>
      </div>
    </Section>
  )
}

/**
 * Drops the view settings of every page, not only of the current one, so that
 * the configured values apply again
 */
const ResetSection = ({close}: {close: () => void}) => {
  const resetFolderParams = useResetFolderParams()

  const reset = () => {
    resetViewSettings()
    resetFolderParams()
    close()
  }

  return (
    <Section title="Defaults">
      <a className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-gray-700 hover:text-gray-300 hover:cursor-pointer"
        onClick={reset}
        title="Reset the view settings of every page to their configured defaults">
        <FontAwesomeIcon icon={icons.faRotateLeft} className="w-4 text-center" />
        <span className="whitespace-nowrap">Reset view settings</span>
      </a>
    </Section>
  )
}

/**
 * View controls of the current page in one menu of the nav bar.
 *
 * The media lists and the folders page have controls of their own, so the
 * panel shows the sections of the page it is rendered on
 */
export const SettingsMenu = ({showList = false, showFolders = false}) => {
  const listSize = useThumbnailSize()
  const folderSize = useFolderThumbnailSize()

  return (
    <Popover
      panelClass="min-w-56"
      trigger={({toggle}) => (
        <NavItem icon={icons.faSliders} text="Settings" onClick={toggle} />
      )}
    >
      {close => (
        <>
          { showList &&
            <>
              <OrderSection close={close} />
              <LayoutSection />
              <SizeSection size={listSize} />
            </>
          }
          { showFolders &&
            <>
              <FolderOrderSection />
              <FolderViewSection />
              <SizeSection size={folderSize} />
            </>
          }
          <ResetSection close={close} />
        </>
      )}
    </Popover>
  )
}
