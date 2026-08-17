import * as React from "react";

import { LayoutToggle } from './LayoutToggle';
import { SortMenu } from './SortMenu';

/**
 * Controls of the media lists. They are only shown on list pages
 */
export const ListNavBar = () => {
  return (
    <>
      <SortMenu />
      <LayoutToggle />
    </>
  )
}
