import * as React from "react";
import {
  useNavigate,
  type NavigateOptions
} from "react-router-dom";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useSearchStore } from "../store/search-store";
import { useEditModeStore, ViewMode } from "../store/edit-mode-store";

import useListLocation from '../utils/useListLocation'
import { useAppConfig } from "../config/useAppConfig";
import { NavItem } from "./NavItem";

type TNavItem = {
  icon: any
  text: string
  action: () => void
  // if true the item is shown but not clickable
  disabled?: boolean
  // if true the item is not shown at all
  hidden?: boolean
}

export const ViewNavBar = ({disableEdit}) => {
  const search = useSearchStore(state => state.search);
  const viewMode = useEditModeStore(state => state.viewMode);
  const setViewMode = useEditModeStore(actions => actions.setViewMode);
  const navigate = useNavigate();
  const listLocation = useListLocation()
  const appConfig = useAppConfig()

  /**
   * Navigates to a page and starts it at its top.
   *
   * The nav item of the current page navigates to the page again, which keeps
   * it mounted and keeps its scroll position with it. The scroll is therefore
   * reset on the click and not only on the mount of the page, see the
   * useScrollToTop hook of the pages
   */
  const navigateToTop = (to: string, options?: NavigateOptions) => {
    navigate(to, options)
    window.scrollTo(0, 0)
  }

  const items: TNavItem[] = [
    {
      icon: icons.faGlobe,
      text: 'Show All',
      action: () => {
        navigateToTop('/')
        search({type: 'none'});
      },
      hidden: appConfig.pages?.disabled?.includes('all'),
    },
    {
      icon: icons.faFolderTree,
      text: 'Albums',
      action: () => navigateToTop('/albums'),
      hidden: appConfig.pages?.disabled?.includes('album'),
    },
    {
      icon: icons.faClockRotateLeft,
      text: 'On This Day',
      action: () => navigateToTop('/on-this-day'),
      hidden: appConfig.pages?.disabled?.includes('onThisDay'),
    },
    {
      icon: icons.faPlay,
      text: 'Videos',
      action: () => navigateToTop('/search/type:video'),
      hidden: appConfig.pages?.disabled?.includes('video'),
    },
    {
      icon: icons.faPen,
      text: 'Edit',
      action: () => {
        if (disableEdit || appConfig.disabled?.includes('edit')) {
          return
        }
        setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW)
      },
      disabled: disableEdit,
      hidden: appConfig.pages?.disabled?.includes('edit') || appConfig.disabled?.includes('edit'),
    },
    {
      icon: icons.faTags,
      text: 'Tags',
      action: () => navigateToTop('/tags'),
      hidden: appConfig.pages?.disabled?.includes('tag'),
    },
    {
      icon: icons.faClock,
      text: 'Years',
      action: () => navigateToTop('/years'),
      hidden: appConfig.pages?.disabled?.includes('date'),
    },
    {
      icon: icons.faMap,
      text: 'Map',
      action: () => navigateToTop('/map', {state: {listLocation}}),
      hidden: appConfig.pages?.disabled?.includes('map'),
    },
  ]
  
  return (
    <>
      {items.filter(item => !item.hidden).map((item, key) => (
        <NavItem key={key} onClick={item.action} icon={item.icon} text={item.text} disabled={item.disabled} />
      ))}
    </>
  )
}
