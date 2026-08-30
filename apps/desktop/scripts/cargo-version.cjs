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
