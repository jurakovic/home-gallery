import * as React from "react";
import { useMemo, useLayoutEffect } from 'react'

import {
  useParams,
} from "react-router-dom";

import { List } from './List';
import { useSearchStore } from '../store/search-store';

export const SearchView = () => {
  const params = useParams();
  const search = useSearchStore(state => state.search);

  // useParams decodes the path param already, a second decode would break a
  // query with a percent sign and drop the escapes of a quoted value
  const term = useMemo(() => params.term || '', [params])
  useLayoutEffect(() => {
    search({type: 'query', value: term});
  }, [term])

  return (
    <>
      <List />
    </>
  )
}
