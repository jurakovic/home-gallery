import * as React from "react";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { LayoutToggle } from './LayoutToggle';
import { SortMenu } from './SortMenu';
import { NavItem } from './NavItem';
import { maxSizeStep, minSizeStep, useThumbnailSize } from '../list/useThumbnailLayout';

/**
 * Controls of the media lists. They are only shown on list pages
 */
export const ListNavBar = () => {
  const [sizeStep, , setSizeStep] = useThumbnailSize()

  const canShrink = sizeStep > minSizeStep
  const canGrow = sizeStep < maxSizeStep

  return (
    <>
      <SortMenu />
      <LayoutToggle />
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
