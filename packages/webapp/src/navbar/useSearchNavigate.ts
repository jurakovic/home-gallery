import { useNavigate } from "react-router-dom";

import { useSearchStore } from "../store/search-store";

/**
 * Navigates to the current view with an other query term.
 *
 * The list views keep their type: a year, similar or faces view stays on its
 * page and takes the term as `q` param.
 *
 * The term is taken unencoded and is encoded here, so that every caller hands
 * over the same value. A query can hold any character, eg the `&` of a `q`
 * param or the `#` of a tag, which would cut the url otherwise
 */
export const useSearchNavigate = () => {
  const query = useSearchStore(state => state.query);
  const navigate = useNavigate();

  return (term: string) => {
    const value = encodeURIComponent(term)
    if (!term) {
      navigate(`/`);
    } else if (query.type == 'none' || query.type == 'query') {
      navigate(`/search/${value}`);
    } else if (query.type == 'year') {
      navigate(`/years/${query.value}?q=${value}`);
    } else if (query.type == 'similar') {
      navigate(`/similar/${query.value}?q=${value}`);
    } else if (query.type == 'faces') {
      navigate(`/faces/${query.value.id}/${query.value.faceIndex}?q=${value}`);
    }
  }
}

/**
 * Query term of the current search, independent of the search type
 */
export const useSearchTerm = () => {
  const query = useSearchStore(state => state.query);

  return (query.type == 'query' ? query.value : query.query) || ''
}
