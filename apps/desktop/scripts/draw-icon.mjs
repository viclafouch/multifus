import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { render } from 'takumi-js'
import { dataUrlOf, inkedWith, loadPalette } from '@multifus/retro/draw'
import { runCommand, TAURI_DIR } from './tauri.mjs'

const { resolve } = createRequire(import.meta.url)

const ICNS_FILE = path.join(TAURI_DIR, 'icons', 'icon.icns')

const LOGO_SOURCE = '@multifus/retro/assets/logo.svg'

const LIFT_ANGLE = '162deg'

const LIFT_ALPHA = 0.2

const LIFT_FROM = '0%'

const LIFT_TO = '58%'

const CROWDED_MAX_SIZE = 32

const CROWDED_SHARE = 0.76

const ROOMY_SHARE = 0.66

const SLOTS = [
  { name: 'icon_16x16.png', size: 16 },
  { name: 'icon_16x16@2x.png', size: 32 },
  { name: 'icon_32x32.png', size: 32 },
  { name: 'icon_32x32@2x.png', size: 64 },
  { name: 'icon_128x128.png', size: 128 },
  { name: 'icon_128x128@2x.png', size: 256 },
  { name: 'icon_256x256.png', size: 256 },
  { name: 'icon_256x256@2x.png', size: 512 },
  { name: 'icon_512x512.png', size: 512 },
  { name: 'icon_512x512@2x.png', size: 1024 }
]

const logoShareOf = (size) => {
  return size <= CROWDED_MAX_SIZE ? CROWDED_SHARE : ROOMY_SHARE
}

const plateHtml = ({ ink, logoUrl, size }) => {
  const logoSize = Math.round(size * logoShareOf(size))
  const lift = `linear-gradient(${LIFT_ANGLE}, ${inkedWith(ink.band, LIFT_ALPHA)} ${LIFT_FROM}, ${inkedWith(ink.band, 0)} ${LIFT_TO})`

  return `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;background-color:${ink.iron};background-image:${lift}">
    <img src="${logoUrl}" width="${logoSize}" height="${logoSize}" />
  </div>`
}

const drawSlots = async ({ stageDir, ink, logoUrl }) => {
  return Promise.all(
    SLOTS.map(async ({ name, size }) => {
      const drawn = await render(plateHtml({ ink, logoUrl, size }), {
        width: size,
        height: size,
        format: 'png',
        fonts: []
      })

      await writeFile(path.join(stageDir, name), drawn)
    })
  )
}

const drawIcon = async () => {
  const [ink, logo] = await Promise.all([
    loadPalette(resolve),
    readFile(resolve(LOGO_SOURCE), 'utf8')
  ])

  const tempRoot = await mkdtemp(path.join(tmpdir(), 'multifus-icon-'))
  const stageDir = path.join(tempRoot, 'icon.iconset')

  try {
    await mkdir(stageDir, { recursive: true })
    await drawSlots({ stageDir, ink, logoUrl: dataUrlOf(logo) })
    await runCommand('iconutil', ['-c', 'icns', stageDir, '-o', ICNS_FILE])
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
}

if (process.platform !== 'darwin') {
  throw new Error('iconutil packs the icns, and only macOS carries it')
}

await drawIcon()

process.stdout.write(
  `${path.relative(TAURI_DIR, ICNS_FILE)} drawn opaque edge to edge, ${SLOTS.length} slots up to 1024\n`
)
