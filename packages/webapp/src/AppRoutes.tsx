import * as React from "react";
import { useEffect, useRef } from "react";
import {
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";


import { AllView } from "./list/All";
import { SearchView } from './list/Search';
import { SimilarView } from './list/Similar';
import { FacesView } from './list/Faces';
import { Years, YearView } from './year/Years';
import { Tags } from './tags/Tags';
import { Folders } from './folders/Folders';
import { Map } from './map';
import { MediaView } from './single/MediaView';
import { useLogger } from "./AppContext";
import { useAppConfig } from "./config/useAppConfig";

const defaultLandingPage = 'all'

/**
 * Landing pages by their config value with the page flag which disables them.
 * Their order is the fallback order of a disabled landing page and follows the
 * nav bar
 */
const landingPages = {
  all: {route: '/', pageFlag: 'all'},
  folders: {route: '/folders', pageFlag: 'folder'},
  tags: {route: '/tags', pageFlag: 'tag'},
  years: {route: '/years', pageFlag: 'date'},
  map: {route: '/map', pageFlag: 'map'},
}

type TLandingPage = keyof typeof landingPages

/** True if the page is known and is not disabled by `webapp.pages.disabled` */
const isEnabled = (name: string, disabled: string[]) => {
  const page = landingPages[name as TLandingPage]
  return !!page && !disabled.includes(page.pageFlag)
}

/**
 * First enabled page of the fallback order. It is undefined if every page is
 * disabled
 */
const findEnabledLandingPage = (disabled: string[]) =>
  (Object.keys(landingPages) as TLandingPage[]).find(name => isEnabled(name, disabled))

/**
 * Navigates once to the page of `webapp.pages.landing` if the app is opened on
 * the root path. Deep links and later navigations to the root path, eg by the
 * 'Show All' nav item, are left alone.
 *
 * An unknown or a disabled landing page falls back to the first enabled page
 * of the fallback order
 */
const useLandingPage = () => {
  const appConfig = useAppConfig()
  const log = useLogger('LandingPage')
  const navigate = useNavigate()
  const location = useLocation()
  const isNavigated = useRef(false)

  useEffect(() => {
    if (isNavigated.current) {
      return
    }
    isNavigated.current = true

    if (location.pathname != '/') {
      return
    }

    const disabled = appConfig.pages?.disabled || []
    const landing = appConfig.pages?.landing || defaultLandingPage

    let name: TLandingPage | undefined = landing
    if (!isEnabled(landing, disabled)) {
      const reason = landingPages[landing] ? 'is disabled by webapp.pages.disabled' : 'is unknown'
      name = findEnabledLandingPage(disabled)
      log.warn(`Page '${landing}' of webapp.pages.landing ${reason}. Show ${name ? `page '${name}'` : 'the page of all media'} instead`)
    }

    // the page of all media is the root path itself and every page can be
    // disabled, which leaves the root path as the last resort
    const page = name && landingPages[name]
    if (!page || page.route == location.pathname) {
      return
    }

    navigate(page.route, {replace: true})
  }, [])
}

export const AppRoutes = () => {
  const appConfig = useAppConfig();

  useLandingPage();

  return (
    <Routes>
      <Route path="/" element={<AllView />} />
      <Route path="/view/:id" element={<MediaView />} />
      <Route path="/share/:id" element={<MediaView />} />
      <Route path="/search/:term" element={<SearchView />} />

      {/* Optional pages routes */}
      {!appConfig.pages?.disabled?.includes('date') && <Route path="/years" element={<Years />} />}
      {!appConfig.pages?.disabled?.includes('date') && <Route path="/years/:year" element={<YearView />} />}
      {!appConfig.pages?.disabled?.includes('tag') && <Route path="/tags" element={<Tags />} />}
      {!appConfig.pages?.disabled?.includes('map') && <Route path="/map" element={<Map />} />}
      {!appConfig.pages?.disabled?.includes('folder') && <Route path="/folders" element={<Folders />} />}

      {/* Conditional routes */}
      {<Route path="/similar/:id" element={<SimilarView />} />}
      {<Route path="/faces/:id/:faceIndex" element={<FacesView />} />}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
