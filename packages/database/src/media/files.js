const toSlash = file => file.replaceAll(/\\/g, '/')

/**
 * The index entry was created when the file index found the file the first
 * time. It is kept while the file is unchanged, so it is the date the file was
 * added to the gallery. A changed, moved or renamed file is a new index entry
 * and gets a new date
 */
const mapFile = ({sha1sum, indexName, type, size, filename, created}) => ({ id: sha1sum, index: indexName, type, size, filename: toSlash(filename), ...(created ? {added: created} : {}) })

export const getFiles = entry => {
  return [mapFile(entry)].concat(entry.sidecars.map(mapFile))
}
