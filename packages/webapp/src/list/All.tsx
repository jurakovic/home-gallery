import * as React from "react";
import { useLayoutEffect } from "react";

import { List } from './List';
import { useSearchStore } from '../store/search-store'

export const AllView = () => {
  const search = useSearchStore(state => state.search);

  useLayoutEffect(() => {
    search({type: 'none'});
  }, [])

  return ( 
    <>
      <List />
    </>
  )
}
