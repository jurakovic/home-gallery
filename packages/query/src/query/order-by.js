import { basename } from './utils.js'

export const orderBy = (ast, context) => {
  if (ast.value.sort) {
    ast.sort = ast.value.sort
  } else {
    const scoreFn = ast.value.scoreFn || (e => e.date)
    const direction = ast.direction || ast.value.direction || 'asc'
    ast.sort = entries => entries.sort(sortBy(scoreFn, direction))
  }
}

export const orderByKey = (ast, context) => {
  switch (ast.value) {
    case 'date':
    case 'updated':
    case 'duration':
    case 'width':
    case 'height':
      ast.scoreFn = e => e[ast.value]
      ast.direction = 'desc'
      break;
    case 'filesize':
      ast.scoreFn = e => e.files?.length ? (e.files[0].size || 0) : 0
      ast.direction = 'desc'
      break;
    // 'file' is the path of the file, 'filename' its base name. Both match the
    // keys of the compare filters
    case 'file':
      ast.scoreFn = e => e.files?.length ? (e.files[0].filename || '') : ''
      ast.direction = 'asc'
      break;
    case 'filename':
      ast.scoreFn = e => e.files?.length ? basename(e.files[0].filename || '') : ''
      ast.direction = 'asc'
      break;
    case 'random':
      ast.sort = entries => {
        for (let i = entries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [entries[j], entries[i]] = [entries[i], entries[j]]
        }
        return entries
      }
      break;
    default:
      ast.scoreFn = () => 1
      ast.direction = 'asc'
      context.queryErrorHandler(ast, context, `Unknown orderByKey mapping. value='${ast.value?.value}' is unknown`)
  }
}

export const orderByFn = (ast, context) => {
  if (ast.fn != 'count') {
    ast.scoreFn = () => 1
    ast.direction = 'asc'
    context.queryErrorHandler(ast, context, `Unknown orderByFn compare mapping. fn=${ast.fn} is unknown`)
    return
  }

  switch (ast.value) {
    case 'files':
    case 'tags':
    case 'faces':
    case 'objects':
      ast.scoreFn = e => e[ast.value]?.length || 0
      ast.direction = 'desc'
      break;
    default:
      ast.scoreFn = () => 1
      ast.direction = 'asc'
      context.queryErrorHandler(ast, context, `Unknown orderByFn mapping for fn=${ast.fn}. value='${ast.value?.value}' is unknown`)
  }
}

export const sortBy = (scoreFn, direction = 'asc') => {
  const value = direction == 'asc' ? -1 : 1
  return (a, b) => {
    const aScore = scoreFn(a) || 0
    const bScore = scoreFn(b) || 0
    if (aScore == bScore) {
      // fallback order by date if values are the same or both are falsy
      return a.date <= b.date ? value : -value
    } else if (aScore && bScore) {
      return aScore < bScore ? value : -value
    } else if (aScore) {
      return -value
    } else if (bScore) {
      return value
    }
    return value
  }
}