import { useNavigate } from "react-router-dom";

import { useSearchStore } from "../store/search-store";

/**
 * Navigates to the current view with an other query term.
 *
 * The list views keep their type: a year, similar or faces view stays on its
 * page and takes the term as `q` param
 */
export const useSearchNavigate = () => {
  const query = useSearchStore(state => state.query);
  const navigate = useNavigate();

  return (term: string) => {
    if (!term) {
      navigate(`/`);
    } else if (query.type == 'none' || query.type == 'query') {
      navigate(`/search/${term}`);
    } else if (query.type == 'year') {
      navigate(`/years/${query.value}?q=${term}`);
    } else if (query.type == 'similar') {
      navigate(`/similar/${query.value}?q=${term}`);
    } else if (query.type == 'faces') {
      navigate(`/faces/${query.value.id}/${query.value.faceIndex}?q=${term}`);
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
