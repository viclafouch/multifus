import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { render } from 'takumi-js'
import {
  dataUrlOf,
  inkedWith,
  loadFonts,
  RETRO_FONTS
} from '@multifus/retro/draw'

const runCommand = promisify(execFile)

const { resolve } = createRequire(import.meta.url)

const TAURI_DIR = path.join(import.meta.dirname, '..', 'src-tauri')

const CONFIG_FILE = path.join(TAURI_DIR, 'tauri.conf.json')

const RETRO_SHEET = '@multifus/retro/styles/retro.css'

const CARVE = RETRO_FONTS.carve.name

const PLAIN = RETRO_FONTS.plain.name

const WORDMARK = 'MULTIFUS'

const TAGLINE = 'Gestionnaire de fenêtres pour Dofus Retro'

const INSTRUCTION = 'GLISSEZ MULTIFUS DANS APPLICATIONS'

const demandOf = (minimumSystemVersion) => {
  return `macOS ${minimumSystemVersion} ou plus récent`
}

const FINDER_ICON_SIZE = 128

const FINDER_LABEL_ROOM = 28

const SLOT_PADDING = 18

const TARGET_WIDTH = 2

const TARGET_RADIUS = 16

const ARROW_WIDTH = 112

const ARROW_HEIGHT = 30

const ARROW_HEAD = 22

const ARROW_WING = 12

const MARGIN = 52

const FRAME_INSET = 13

const FRAME_RADIUS = 10

const RULE_INSET = 18

const RULE_RADIUS = 6

const CREST_TOP = 40

const THREAD_TOP = 118

const THREAD_HEIGHT = 3

const INSTRUCTION_GAP = 24

const PLATES = [
  { name: 'background.png', ratio: 1 },
  { name: 'background@2x.png', ratio: 2 }
]

const INK_NAMES = {
  iron: 'iron',
  slate: 'slate',
  band: 'band',
  khaki: 'khaki',
  cream: 'cream',
  leaf: 'leaf',
  leafLit: 'leaf-lit'
}

const HEX_DECLARATION = /--([a-z-]+):\s*(#[\da-f]{6})\b/gu

const paletteOf = (sheet) => {
  const declared = new Map()

  for (const [, name, hex] of sheet.matchAll(HEX_DECLARATION)) {
    declared.set(name, hex)
  }

  const picked = Object.entries(INK_NAMES).map(([key, name]) => {
    const hex = declared.get(name)

    if (hex === undefined) {
      throw new Error(`no retro sheet declares --${name} as a hex color`)
    }

    return [key, hex]
  })

  return Object.fromEntries(picked)
}

const arrowUrl = (ink) => {
  const stem = ARROW_WIDTH - ARROW_HEAD
  const middle = ARROW_HEIGHT / 2
  const wing = stem - ARROW_WING / 2

  return dataUrlOf(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ARROW_WIDTH}" height="${ARROW_HEIGHT}" viewBox="0 0 ${ARROW_WIDTH} ${ARROW_HEIGHT}"><path d="M0 ${middle}H${stem}" stroke="${ink.leafLit}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 11"/><path d="M${wing} ${middle - ARROW_WING}L${ARROW_WIDTH} ${middle}L${wing} ${middle + ARROW_WING}Z" fill="${ink.leafLit}"/></svg>`
  )
}

const layoutOf = (dmg) => {
  const slotWidth = FINDER_ICON_SIZE + SLOT_PADDING * 2
  const slotHeight = FINDER_ICON_SIZE + FINDER_LABEL_ROOM + SLOT_PADDING * 2
  const slotTop = dmg.appPosition.y - FINDER_ICON_SIZE / 2 - SLOT_PADDING

  return {
    width: dmg.windowSize.width,
    height: dmg.windowSize.height,
    slotWidth,
    slotHeight,
    slotTop,
    slotBottom: slotTop + slotHeight,
    applicationsLeft: dmg.applicationFolderPosition.x - slotWidth / 2,
    arrowLeft:
      (dmg.appPosition.x + dmg.applicationFolderPosition.x) / 2 -
      ARROW_WIDTH / 2,
    arrowTop: dmg.appPosition.y - ARROW_HEIGHT / 2
  }
}

const paperCss = (ink, layout) => {
  return `
    .sheet {
      position: relative;
      display: flex;
      width: ${layout.width}px;
      height: ${layout.height}px;
      background-color: ${ink.cream};
    }

    .wear {
      position: absolute;
      top: 0;
      left: 0;
      width: ${layout.width}px;
      height: ${layout.height}px;
      background-image: linear-gradient(159deg, ${inkedWith(ink.khaki, 0.26)} 0%, ${inkedWith(ink.cream, 0)} 26%, ${inkedWith(ink.cream, 0)} 58%, ${inkedWith(ink.khaki, 0.3)} 84%, ${inkedWith(ink.band, 0.42)} 100%);
    }

    .frame {
      position: absolute;
      top: ${FRAME_INSET}px;
      left: ${FRAME_INSET}px;
      width: ${layout.width - FRAME_INSET * 2}px;
      height: ${layout.height - FRAME_INSET * 2}px;
      border: 1px solid ${inkedWith(ink.band, 0.62)};
      border-radius: ${FRAME_RADIUS}px;
    }

    .rule {
      position: absolute;
      top: ${RULE_INSET}px;
      left: ${RULE_INSET}px;
      width: ${layout.width - RULE_INSET * 2}px;
      height: ${layout.height - RULE_INSET * 2}px;
      border: 1px solid ${inkedWith(ink.band, 0.3)};
      border-radius: ${RULE_RADIUS}px;
    }
  `
}

const crestCss = (ink, layout) => {
  return `
    .crest {
      position: absolute;
      top: ${CREST_TOP}px;
      left: ${MARGIN}px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      width: ${layout.width - MARGIN * 2}px;
    }

    .titles {
      display: flex;
      flex-direction: column;
    }

    .wordmark {
      display: flex;
      font-family: '${CARVE}';
      font-size: 44px;
      line-height: 0.9;
      letter-spacing: 0.15em;
      color: ${ink.iron};
    }

    .tagline {
      display: flex;
      margin-top: 7px;
      font-family: '${PLAIN}';
      font-size: 13px;
      color: ${inkedWith(ink.slate, 0.76)};
    }

    .demand {
      display: flex;
      margin-bottom: 3px;
      font-family: '${PLAIN}';
      font-size: 12px;
      color: ${inkedWith(ink.slate, 0.62)};
    }

    .thread {
      position: absolute;
      top: ${THREAD_TOP}px;
      left: ${MARGIN}px;
      width: ${layout.width - MARGIN * 2}px;
      height: ${THREAD_HEIGHT}px;
      border-radius: ${THREAD_HEIGHT}px;
      background-image: linear-gradient(90deg, ${ink.leafLit} 0%, ${inkedWith(ink.leaf, 0.5)} 22%, ${inkedWith(ink.band, 0.42)} 48%, ${inkedWith(ink.band, 0.3)} 100%);
    }
  `
}

const stageCss = (ink, layout) => {
  return `
    .target {
      position: absolute;
      top: ${layout.slotTop}px;
      left: ${layout.applicationsLeft}px;
      width: ${layout.slotWidth}px;
      height: ${layout.slotHeight}px;
      border: ${TARGET_WIDTH}px dashed ${inkedWith(ink.leafLit, 0.6)};
      border-radius: ${TARGET_RADIUS}px;
      background-color: ${inkedWith(ink.band, 0.1)};
    }

    .arrow {
      position: absolute;
      top: ${layout.arrowTop}px;
      left: ${layout.arrowLeft}px;
      width: ${ARROW_WIDTH}px;
      height: ${ARROW_HEIGHT}px;
    }

    .instruction {
      position: absolute;
      top: ${layout.slotBottom + INSTRUCTION_GAP}px;
      left: 0;
      display: flex;
      justify-content: center;
      width: ${layout.width}px;
      font-family: '${CARVE}';
      font-size: 19px;
      letter-spacing: 0.22em;
      color: ${inkedWith(ink.slate, 0.84)};
    }
  `
}

const styleSheetOf = (ink, layout) => {
  return [
    paperCss(ink, layout),
    crestCss(ink, layout),
    stageCss(ink, layout)
  ].join('')
}

const bodyHtml = ({ ink, demand }) => {
  return `
    <div class="sheet">
      <div class="wear"></div>
      <div class="frame"></div>
      <div class="rule"></div>
      <div class="crest">
        <div class="titles">
          <div class="wordmark">${WORDMARK}</div>
          <div class="tagline">${TAGLINE}</div>
        </div>
        <div class="demand">${demand}</div>
      </div>
      <div class="thread"></div>
      <div class="target"></div>
      <img class="arrow" src="${arrowUrl(ink)}" />
      <div class="instruction">${INSTRUCTION}</div>
    </div>
  `
}

const platesOf = async ({ stageDir, html, css, layout, fonts }) => {
  return Promise.all(
    PLATES.map(async ({ name, ratio }) => {
      const drawn = await render(html, {
        width: layout.width * ratio,
        height: layout.height * ratio,
        format: 'png',
        devicePixelRatio: ratio,
        fonts,
        css
      })

      const file = path.join(stageDir, name)

      await writeFile(file, drawn)

      return file
    })
  )
}

const drawBackground = async () => {
  const [config, sheet, fonts] = await Promise.all([
    readFile(CONFIG_FILE, 'utf8'),
    readFile(resolve(RETRO_SHEET), 'utf8'),
    loadFonts(resolve)
  ])

  const { dmg, minimumSystemVersion } = JSON.parse(config).bundle.macOS
  const ink = paletteOf(sheet)
  const layout = layoutOf(dmg)
  const background = path.join(TAURI_DIR, dmg.background)
  const stageDir = await mkdtemp(path.join(tmpdir(), 'multifus-dmg-'))

  try {
    const plates = await platesOf({
      stageDir,
      html: bodyHtml({ ink, demand: demandOf(minimumSystemVersion) }),
      css: styleSheetOf(ink, layout),
      layout,
      fonts
    })

    await mkdir(path.dirname(background), { recursive: true })
    await runCommand('tiffutil', [
      '-cathidpicheck',
      ...plates,
      '-out',
      background
    ])
  } finally {
    await rm(stageDir, { recursive: true, force: true })
  }

  return { background, layout }
}

if (process.platform !== 'darwin') {
  throw new Error(
    'tiffutil draws the DMG background, and only macOS carries it'
  )
}

const { background, layout } = await drawBackground()

process.stdout.write(
  `${path.relative(TAURI_DIR, background)} drawn at ${layout.width}x${layout.height}, and at twice that\n`
)
