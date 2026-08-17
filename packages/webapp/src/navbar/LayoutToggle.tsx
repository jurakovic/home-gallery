import * as React from "react";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useThumbnailLayout } from "../list/useThumbnailLayout";
import { NavItem } from "./NavItem";

export const LayoutToggle = () => {
  const [layout, toggleLayout] = useThumbnailLayout()

  const isSquare = layout == 'square'

  return (
    <NavItem
      icon={isSquare ? icons.faTableCellsLarge : icons.faImages}
      text={isSquare ? 'Square' : 'Fluent'}
      onClick={toggleLayout}
    />
  )
}
