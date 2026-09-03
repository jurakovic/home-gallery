import Logger from '@home-gallery/logger'

const log = Logger('database.build');

import { mergeFromJournal } from './merge/merge-journalv2.js';
import { writeDatabasev2 } from './database/write-databasev2.js';
import { readDatabaseHeader } from './database/read-database-stream.js';

import { createStorage } from './storage.js';

import { createEntries } from './create-entries.js'
import { getTimezone } from './media/date.js'

/**
 * A journal merge keeps the entries of the database and adds the mapped ones,
 * so the media dates of both must share their time zone.
 *
 * A database without the header property was built before the setting. Its
 * dates are instants of the time zone of the host which built them, which is
 * none of both settings, so it has to be rebuilt as well
 */
const assertTimezone = async (databaseFilename, timezone) => {
  const header = await readDatabaseHeader(databaseFilename)
  if (!header || header.timezone == timezone) {
    return
  }

  const databaseTimezone = header.timezone ? `in the '${header.timezone}' time zone` : `from a gallery before the database.timezone setting`
  throw new Error(`The media dates of database ${databaseFilename} are ${databaseTimezone} but the configured database.timezone is '${timezone}'. Run 'gallery database' to rebuild the database with the configured time zone. It reuses the extracted meta data`)
}

export async function build(options) {
  const indexFilenames = options.config.fileIndex.files;
  const journal = options.config.fileIndex.journal;

  const storageDir = options.config.storage.dir;
  const storage = createStorage(storageDir)

  const databaseFilename = options.config.database.file;
  const timezone = getTimezone(options.config);

  if (journal) {
    await assertTimezone(databaseFilename, timezone)
  }

  const t0 = Date.now()
  const slimEntries = await createEntries(indexFilenames, journal, storage, options)
    .catch(err => {
      log.error(`Could not build database entries: ${err}`);
      throw err
    })
  log.info(t0, `Created ${slimEntries.length} database entries`)

  const t2 = Date.now()
  let count
  if (journal) {
    count = await mergeFromJournal(indexFilenames, journal, databaseFilename, slimEntries, storage, timezone)
  } else {
    count = await writeDatabasev2(databaseFilename, slimEntries, storage, timezone)
  }
  log.info(t2, `Wrote database with ${count} entries to ${databaseFilename}`)
  return count
}
