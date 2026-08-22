import * as React from "react";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavItem } from './NavItem';
import { maxSizeStep, minSizeStep, useThumbnailSize } from '../list/useThumbnailLayout';

/**
 * Thumbnail size controls of the squared cells. They are shared by the media
 * lists and by the grid view of the folders page, so both use the same size
 */
export const ThumbnailSizeNav = () => {
  const [sizeStep, , setSizeStep] = useThumbnailSize()

  const canShrink = sizeStep > minSizeStep
  const canGrow = sizeStep < maxSizeStep

  return (
    <>
      <NavItem
        icon={icons.faMagnifyingGlassMinus}
        text="Smaller"
        disabled={!canShrink}
        onClick={() => canShrink && setSizeStep(sizeStep - 1)}
      />
      <NavItem
        icon={icons.faMagnifyingGlassPlus}
        text="Larger"
        disabled={!canGrow}
        onClick={() => canGrow && setSizeStep(sizeStep + 1)}
      />
    </>
  )
}
