const TOP_LEVEL_VERSION_LINE = /^( {2}"version": ")(.+?)(")/m

const readVersion = (contents) => {
  const found = TOP_LEVEL_VERSION_LINE.exec(contents)

  if (found === null) {
    throw new Error('no top-level version to read in tauri.conf.json')
  }

  return found[2]
}

const writeVersion = (contents, version) => {
  return contents.replace(TOP_LEVEL_VERSION_LINE, `$1${version}$3`)
}

module.exports = { readVersion, writeVersion }
