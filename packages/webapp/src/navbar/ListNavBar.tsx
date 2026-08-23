import * as React from "react";

import { LayoutToggle } from './LayoutToggle';
import { SortMenu } from './SortMenu';
import { ThumbnailSizeNav } from './ThumbnailSizeNav';
import { useThumbnailSize } from '../list/useThumbnailLayout';

/**
 * Controls of the media lists. They are only shown on list pages
 */
export const ListNavBar = () => {
  const size = useThumbnailSize()

  return (
    <>
      <SortMenu />
      <LayoutToggle />
      <ThumbnailSizeNav size={size} />
    </>
  )
}
