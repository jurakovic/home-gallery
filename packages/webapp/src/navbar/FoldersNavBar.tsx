import * as React from "react";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavItem } from './NavItem';
import { ThumbnailSizeNav } from './ThumbnailSizeNav';
import { useFolderOrder, useFolderThumbnailSize, useFolderView } from '../folders/useFoldersView';

/**
 * Controls of the folders page. They are only shown on the folders page
 */
export const FoldersNavBar = () => {
  const [isGrid, toggleView] = useFolderView()
  const [descending, toggleOrder] = useFolderOrder()
  const size = useFolderThumbnailSize()

  return (
    <>
      <NavItem
        icon={descending ? icons.faArrowDownWideShort : icons.faArrowUpShortWide}
        text="Name"
        onClick={toggleOrder}
      />
      <NavItem
        icon={isGrid ? icons.faTableCellsLarge : icons.faList}
        text={isGrid ? 'Grid' : 'List'}
        onClick={toggleView}
      />
      <ThumbnailSizeNav size={size} />
    </>
  )
}
