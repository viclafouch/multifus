import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { render } from 'takumi-js'
import { loadFonts, RETRO_FONTS } from '@multifus/retro/draw'

const runCommand = promisify(execFile)

const { resolve } = createRequire(import.meta.url)

const TAURI_DIR = path.join(import.meta.dirname, '..', 'src-tauri')

const CONFIG_FILE = path.join(TAURI_DIR, 'tauri.conf.json')

const APP_ICON = path.join(TAURI_DIR, 'icons', '128x128@2x.png')

const APPLICATIONS_ICON =
  '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/ApplicationsFolderIcon.icns'

const PREVIEW_FILE = path.join(tmpdir(), 'multifus-dmg-preview.png')

const FINDER_TITLE_BAR = 28

const FINDER_ICON_SIZE = 128

const FINDER_LABEL_SIZE = 16

const FINDER_LABEL_GAP = 3

const LABEL_WIDTH = 180

const pngUrl = (bytes) => {
  return `data:image/png;base64,${bytes.toString('base64')}`
}

const iconHtml = ({ icon, label, position }) => {
  return `
    <div style="position:absolute;top:${position.y - FINDER_ICON_SIZE / 2}px;left:${position.x - LABEL_WIDTH / 2}px;display:flex;flex-direction:column;align-items:center;width:${LABEL_WIDTH}px">
      <img src="${pngUrl(icon)}" width="${FINDER_ICON_SIZE}" height="${FINDER_ICON_SIZE}" />
      <div style="display:flex;margin-top:${FINDER_LABEL_GAP}px;font-family:'${RETRO_FONTS.plain.name}';font-size:${FINDER_LABEL_SIZE}px;color:#000">${label}</div>
    </div>
  `
}

const pngBytesOf = async ({ stageDir, source, size }) => {
  const drawn = path.join(stageDir, `${path.basename(source)}.png`)
  const sizing = size === undefined ? [] : ['-Z', String(size)]

  await runCommand('sips', [
    '-s',
    'format',
    'png',
    ...sizing,
    source,
    '--out',
    drawn
  ])

  return readFile(drawn)
}

const drawPreview = async (stageDir) => {
  const config = JSON.parse(await readFile(CONFIG_FILE, 'utf8'))
  const { dmg } = config.bundle.macOS
  const { width, height } = dmg.windowSize

  const [background, appIcon, applicationsIcon, fonts] = await Promise.all([
    pngBytesOf({ stageDir, source: path.join(TAURI_DIR, dmg.background) }),
    readFile(APP_ICON),
    pngBytesOf({ stageDir, source: APPLICATIONS_ICON, size: 256 }),
    loadFonts(resolve)
  ])

  const icons = [
    { icon: appIcon, label: config.productName, position: dmg.appPosition },
    {
      icon: applicationsIcon,
      label: 'Applications',
      position: dmg.applicationFolderPosition
    }
  ]

  const visible = height - FINDER_TITLE_BAR

  const drawn = await render(
    `<div style="position:relative;display:flex;width:${width}px;height:${visible}px;background-color:#fff">
       <img src="${pngUrl(background)}" width="${width}" height="${height}" style="position:absolute;top:0;left:0" />
       ${icons.map(iconHtml).join('')}
     </div>`,
    { width, height: visible, format: 'png', fonts }
  )

  await writeFile(PREVIEW_FILE, drawn)

  return { width, height: visible }
}

if (process.platform !== 'darwin') {
  throw new Error('the preview borrows the Applications icon, which macOS owns')
}

const stageDir = await mkdtemp(path.join(tmpdir(), 'multifus-preview-'))

try {
  const { width, height } = await drawPreview(stageDir)

  process.stdout.write(
    `${PREVIEW_FILE}\ndrawn at ${width}x${height}, open it to look\n`
  )
} finally {
  await rm(stageDir, { recursive: true, force: true })
}
