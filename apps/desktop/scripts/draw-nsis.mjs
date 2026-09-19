import { Buffer } from 'node:buffer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { render } from 'takumi-js'
import {
  inkedWith,
  loadFonts,
  loadPalette,
  RETRO_FONTS,
  TAGLINE,
  WORDMARK
} from '@multifus/retro/draw'
import { readConfig, TAURI_DIR } from './tauri.mjs'

const { resolve } = createRequire(import.meta.url)

const APP_ICON = path.join(TAURI_DIR, 'icons', '128x128@2x.png')

const CARVE = RETRO_FONTS.carve.name

const PLAIN = RETRO_FONTS.plain.name

const HEADER_WIDTH = 150

const HEADER_HEIGHT = 57

const SIDEBAR_WIDTH = 164

const SIDEBAR_HEIGHT = 314

const THREAD_HEIGHT = 3

const FRAME_INSET = 8

const FRAME_RADIUS = 6

const BADGE_SIZE = 84

const TAGLINE_ROOM = 122

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

const paperCss = (ink, { width, height }) => {
  return `
    .sheet {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: ${width}px;
      height: ${height}px;
      background-color: ${ink.cream};
    }

    .wear {
      position: absolute;
      top: 0;
      left: 0;
      width: ${width}px;
      height: ${height}px;
      background-image: linear-gradient(159deg, ${inkedWith(ink.khaki, 0.26)} 0%, ${inkedWith(ink.cream, 0)} 26%, ${inkedWith(ink.cream, 0)} 58%, ${inkedWith(ink.khaki, 0.3)} 84%, ${inkedWith(ink.band, 0.42)} 100%);
    }

    .thread {
      height: ${THREAD_HEIGHT}px;
      border-radius: ${THREAD_HEIGHT}px;
      background-image: linear-gradient(90deg, ${ink.leafLit} 0%, ${inkedWith(ink.leaf, 0.5)} 22%, ${inkedWith(ink.band, 0.42)} 48%, ${inkedWith(ink.band, 0.3)} 100%);
    }
  `
}

const headerCss = (ink) => {
  return `
    ${paperCss(ink, { width: HEADER_WIDTH, height: HEADER_HEIGHT })}

    .wordmark {
      display: flex;
      font-family: '${CARVE}';
      font-size: 27px;
      line-height: 1;
      letter-spacing: 0.14em;
      color: ${ink.iron};
    }

    .thread {
      position: absolute;
      top: ${HEADER_HEIGHT - THREAD_HEIGHT}px;
      left: 0;
      width: ${HEADER_WIDTH}px;
      border-radius: 0;
    }
  `
}

const headerHtml = () => {
  return `
    <div class="sheet">
      <div class="wear"></div>
      <div class="wordmark">${WORDMARK}</div>
      <div class="thread"></div>
    </div>
  `
}

const sidebarCss = (ink) => {
  return `
    ${paperCss(ink, { width: SIDEBAR_WIDTH, height: SIDEBAR_HEIGHT })}

    .frame {
      position: absolute;
      top: ${FRAME_INSET}px;
      left: ${FRAME_INSET}px;
      width: ${SIDEBAR_WIDTH - FRAME_INSET * 2}px;
      height: ${SIDEBAR_HEIGHT - FRAME_INSET * 2}px;
      border: 1px solid ${inkedWith(ink.band, 0.62)};
      border-radius: ${FRAME_RADIUS}px;
    }

    .badge {
      width: ${BADGE_SIZE}px;
      height: ${BADGE_SIZE}px;
    }

    .wordmark {
      display: flex;
      margin-top: 22px;
      font-family: '${CARVE}';
      font-size: 32px;
      line-height: 1;
      letter-spacing: 0.15em;
      color: ${ink.iron};
    }

    .thread {
      margin-top: 14px;
      width: 62px;
    }

    .tagline {
      display: flex;
      margin-top: 16px;
      width: ${TAGLINE_ROOM}px;
      font-family: '${PLAIN}';
      font-size: 11px;
      line-height: 1.5;
      text-align: center;
      color: ${inkedWith(ink.slate, 0.76)};
    }
  `
}

const sidebarHtml = (badge) => {
  return `
    <div class="sheet">
      <div class="wear"></div>
      <div class="frame"></div>
      <img class="badge" src="${badge}" />
      <div class="wordmark">${WORDMARK}</div>
      <div class="thread"></div>
      <div class="tagline">${TAGLINE}</div>
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

const drawImages = async () => {
  const [config, ink, icon, fonts] = await Promise.all([
    readConfig(),
    loadPalette(resolve),
    readFile(APP_ICON),
    loadFonts(resolve)
  ])

  const { headerImage, sidebarImage } = config.bundle.windows.nsis
  const badge = `data:image/png;base64,${icon.toString('base64')}`

  await Promise.all([
    plateOf({
      file: path.join(TAURI_DIR, headerImage),
      html: headerHtml(),
      css: headerCss(ink),
      width: HEADER_WIDTH,
      height: HEADER_HEIGHT,
      fonts
    }),
    plateOf({
      file: path.join(TAURI_DIR, sidebarImage),
      html: sidebarHtml(badge),
      css: sidebarCss(ink),
      width: SIDEBAR_WIDTH,
      height: SIDEBAR_HEIGHT,
      fonts
    })
  ])

  return [headerImage, sidebarImage]
}

const drawn = await drawImages()

process.stdout.write(
  `${drawn.join(' and ')} drawn at ${HEADER_WIDTH}x${HEADER_HEIGHT} and ${SIDEBAR_WIDTH}x${SIDEBAR_HEIGHT}\n`
)
