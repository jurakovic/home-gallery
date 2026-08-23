import * as React from "react";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useThumbnailLayout } from "../list/useThumbnailLayout";
import { NavItem } from "./NavItem";

const layoutIcons = {
  fluent: icons.faImages,
  square: icons.faTableCellsLarge,
  list: icons.faList,
}

const layoutNames = {
  fluent: 'Fluent',
  square: 'Square',
  list: 'List',
}

/** Cycles through the thumbnail layouts and shows the current one */
export const LayoutToggle = () => {
  const [layout, toggleLayout] = useThumbnailLayout()

  return (
    <NavItem
      icon={layoutIcons[layout]}
      text={layoutNames[layout]}
      onClick={toggleLayout}
    />
  )
}
