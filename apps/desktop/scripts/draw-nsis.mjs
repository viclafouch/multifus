import { Buffer } from 'node:buffer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { render } from 'takumi-js'
import {
  inkedWith,
  loadFonts,
  limelightOf,
  loadPalette,
  RETRO_FONTS,
  threadOf,
  WORDMARK
} from '@multifus/retro/draw'
import { readConfig, TAURI_DIR } from './tauri.mjs'

const { resolve } = createRequire(import.meta.url)

const APP_ICON = path.join(TAURI_DIR, 'icons', '128x128@2x.png')

const DECOR = '@multifus/ankama/images/village.webp'

const CARVE = RETRO_FONTS.carve.name

const SIDEBAR_WIDTH = 164

const SIDEBAR_HEIGHT = 314

const THREAD_HEIGHT = 3

const FRAME_INSET = 8

const FRAME_RADIUS = 6

const BADGE_SIZE = 36

const SIDEBAR_PADDING = 22

const BMP_HEADER_SIZE = 54

const BMP_INFO_SIZE = 40

const BMP_PLANES = 1

const BMP_DEPTH = 24

const BMP_CHANNELS = 3

const BMP_ROW_ALIGNMENT = 4

const RGBA_CHANNELS = 4

const bmpOf = ({ pixels, width, height }) => {
  const stride =
    Math.ceil((width * BMP_CHANNELS) / BMP_ROW_ALIGNMENT) * BMP_ROW_ALIGNMENT
  const body = Buffer.alloc(stride * height)

  for (let row = 0; row < height; row += 1) {
    const read = row * width * RGBA_CHANNELS
    const write = (height - 1 - row) * stride

    for (let column = 0; column < width; column += 1) {
      const from = read + column * RGBA_CHANNELS
      const to = write + column * BMP_CHANNELS

      body[to] = pixels[from + 2]
      body[to + 1] = pixels[from + 1]
      body[to + 2] = pixels[from]
    }
  }

  const header = Buffer.alloc(BMP_HEADER_SIZE)

  header.write('BM', 0, 'ascii')
  header.writeUInt32LE(BMP_HEADER_SIZE + body.length, 2)
  header.writeUInt32LE(BMP_HEADER_SIZE, 10)
  header.writeUInt32LE(BMP_INFO_SIZE, 14)
  header.writeInt32LE(width, 18)
  header.writeInt32LE(height, 22)
  header.writeUInt16LE(BMP_PLANES, 26)
  header.writeUInt16LE(BMP_DEPTH, 28)
  header.writeUInt32LE(body.length, 34)

  return Buffer.concat([header, body])
}

const sidebarCss = (ink) => {
  return `
    .sheet {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      width: ${SIDEBAR_WIDTH}px;
      height: ${SIDEBAR_HEIGHT}px;
      padding: ${SIDEBAR_PADDING}px;
      background-color: ${ink.iron};
    }

    .layer {
      position: absolute;
      top: 0;
      left: 0;
      width: ${SIDEBAR_WIDTH}px;
      height: ${SIDEBAR_HEIGHT}px;
    }

    .decor {
      object-fit: cover;
      filter: saturate(0.88);
    }

    .floor {
      background-image: linear-gradient(180deg, ${inkedWith(ink.iron, 0.55)} 0%, ${inkedWith(ink.iron, 0.18)} 22%, ${inkedWith(ink.iron, 0.3)} 46%, ${inkedWith(ink.iron, 0.9)} 72%, ${inkedWith(ink.iron, 0.98)} 100%);
    }

    .frame {
      position: absolute;
      top: ${FRAME_INSET}px;
      left: ${FRAME_INSET}px;
      width: ${SIDEBAR_WIDTH - FRAME_INSET * 2}px;
      height: ${SIDEBAR_HEIGHT - FRAME_INSET * 2}px;
      border: 1px solid ${inkedWith(ink.band, 0.3)};
      border-radius: ${FRAME_RADIUS}px;
    }

    .badge {
      position: relative;
      width: ${BADGE_SIZE}px;
      height: ${BADGE_SIZE}px;
    }

    .wordmark {
      position: relative;
      display: flex;
      margin-top: 14px;
      font-family: '${CARVE}';
      font-size: 34px;
      line-height: 0.9;
      letter-spacing: 0.02em;
      color: ${ink.cream};
      text-shadow: ${limelightOf(ink.iron)};
    }

    .thread {
      position: relative;
      margin-top: 12px;
      width: 72px;
      height: ${THREAD_HEIGHT}px;
      border-radius: ${THREAD_HEIGHT}px;
      background-image: ${threadOf(ink)};
    }
  `
}

const sidebarHtml = ({ badge, decor }) => {
  return `
    <div class="sheet">
      <img class="layer decor" src="${decor}" />
      <div class="layer floor"></div>
      <div class="frame"></div>
      <img class="badge" src="${badge}" />
      <div class="wordmark">${WORDMARK}</div>
      <div class="thread"></div>
    </div>
  `
}

const plateOf = async ({ file, html, css, width, height, fonts }) => {
  const pixels = await render(html, {
    width,
    height,
    format: 'raw',
    fonts,
    css
  })

  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, bmpOf({ pixels, width, height }))
}

const drawSidebar = async () => {
  const [config, ink, icon, scene, fonts] = await Promise.all([
    readConfig(),
    loadPalette(resolve),
    readFile(APP_ICON),
    readFile(resolve(DECOR)),
    loadFonts(resolve)
  ])

  const { sidebarImage } = config.bundle.windows.nsis
  const badge = `data:image/png;base64,${icon.toString('base64')}`
  const decor = `data:image/webp;base64,${scene.toString('base64')}`

  await plateOf({
    file: path.join(TAURI_DIR, sidebarImage),
    html: sidebarHtml({ badge, decor }),
    css: sidebarCss(ink),
    width: SIDEBAR_WIDTH,
    height: SIDEBAR_HEIGHT,
    fonts
  })

  return sidebarImage
}

const drawn = await drawSidebar()

process.stdout.write(`${drawn} drawn at ${SIDEBAR_WIDTH}x${SIDEBAR_HEIGHT}\n`)
