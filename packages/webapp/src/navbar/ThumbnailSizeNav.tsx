import * as React from "react";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavItem } from './NavItem';
import { maxSizeStep, minSizeStep, type TThumbnailSize } from '../list/useThumbnailLayout';

/**
 * Thumbnail size controls of the given size. The media lists and the folders
 * page keep their own size, so every nav bar passes its own
 */
export const ThumbnailSizeNav = ({size}: {size: TThumbnailSize}) => {
  const [sizeStep, , setSizeStep] = size

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
