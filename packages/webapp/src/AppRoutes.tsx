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

const landingPages = {
  all: {route: '/', pageFlag: ''},
  folders: {route: '/folders', pageFlag: 'folder'},
  years: {route: '/years', pageFlag: 'date'},
  tags: {route: '/tags', pageFlag: 'tag'},
  map: {route: '/map', pageFlag: 'map'},
}

/**
 * Navigates once to the page of `webapp.pages.landing` if the app is opened on
 * the root path. Deep links and later navigations to the root path, eg by the
 * 'Show All' nav item, are left alone
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

    const landing = appConfig.pages?.landing || defaultLandingPage
    const page = landingPages[landing]
    if (!page) {
      log.warn(`Unknown page '${landing}' of webapp.pages.landing. Show page ${defaultLandingPage} instead`)
      return
    } else if (page.pageFlag && appConfig.pages?.disabled?.includes(page.pageFlag)) {
      log.warn(`Page '${landing}' of webapp.pages.landing is disabled by webapp.pages.disabled. Show page ${defaultLandingPage} instead`)
      return
    } else if (landing == defaultLandingPage || location.pathname != '/') {
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
