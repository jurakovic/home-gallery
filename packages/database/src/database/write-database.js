import fs from 'fs';

import { writeJsonGzip, writeSafe } from '@home-gallery/common';
import { initDatabase } from './read-database.js'

/**
 * The time zone of the media dates is a property of the database, so a rewrite
 * has to carry it over, see database.timezone
 */
export const writeDatabase = (filename, entries, timezone, cb) => {
  const database = initDatabase(entries, timezone);

  const tmp = `${filename}.tmp`;
  writeJsonGzip(tmp, database, err => {
    if (err) {
      return cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : database));
  });
}

export const writeDatabasePlain = (filename, entries, timezone, cb) => {
  const database = initDatabase(entries, timezone);
  const data = JSON.stringify(database);

  const tmp = `${filename}.tmp`;
  writeSafe(tmp, data, err => {
    if (err) {
      return cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : database));
  });
}
