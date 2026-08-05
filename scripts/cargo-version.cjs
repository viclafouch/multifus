/**
 * Keeps the Rust manifest and its lock file in step with the version
 * `standard-version` writes into the JSON files.
 *
 * Without this the versions of a release drift: `package.json` and
 * `tauri.conf.json` move, the Rust side stays behind, and whoever opens the
 * manifest next reads a version that shipped several releases ago. The bundle
 * takes its version from `tauri.conf.json`, so nothing breaks and nobody
 * notices, which is exactly why it is worth closing here.
 *
 * One expression covers both files: `Cargo.toml` and `Cargo.lock` each name
 * this package on one line and give its version on the next. Matching on the
 * name rather than on a position is what keeps this off the hundred other
 * versions the lock file holds.
 */

const MULTIFUS_VERSION_LINE = /(name = "multifus"\r?\nversion = ")(.+?)(")/

const readVersion = (contents) => {
  const found = MULTIFUS_VERSION_LINE.exec(contents)

  if (found === null) {
    throw new Error('no multifus package to read a version from')
  }

  return found[2]
}

const writeVersion = (contents, version) => {
  return contents.replace(MULTIFUS_VERSION_LINE, `$1${version}$3`)
}

module.exports = { readVersion, writeVersion }
