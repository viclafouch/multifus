import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { render } from 'takumi-js'
import { OG_DECOR_FILES } from '@/constants/decors'
import { LANGUAGES } from '@/constants/languages'
import { OG_DIR, OG_HEIGHT, OG_IMAGE, OG_WIDTH } from '@/constants/og'
import { PAGE_IDS } from '@/constants/pages'
import { ogPathOf } from '@/helpers/page'
import { OG_FONTS } from '@/og/fonts'
import { OgCard } from '@/og/og-card'

const PUBLIC_DIR = path.join(import.meta.dirname, '..', '..', 'public')

const LOGO_FILE = '@multifus/retro/assets/logo.png'

const { resolve } = createRequire(import.meta.url)

const loadFonts = () => {
  return Promise.all(
    Object.values(OG_FONTS).map(async ({ name, file }) => {
      return { name, data: await readFile(resolve(file)) }
    })
  )
}

const loadImage = async (file: string, type: string) => {
  const bytes = await readFile(resolve(file))

  return `data:${type};base64,${bytes.toString('base64')}`
}

const loadDecors = async () => {
  const drawn = await Promise.all(
    Object.entries(OG_DECOR_FILES).map(async ([page, file]) => {
      return [page, await loadImage(file, 'image/webp')] as const
    })
  )

  return Object.fromEntries(drawn)
}

export const drawEveryCard = async () => {
  const [fonts, decors, logo] = await Promise.all([
    loadFonts(),
    loadDecors(),
    loadImage(LOGO_FILE, 'image/png')
  ])

  await rm(path.join(PUBLIC_DIR, OG_DIR), { recursive: true, force: true })

  const drawings = LANGUAGES.flatMap((language) => {
    return PAGE_IDS.map(async (page) => {
      const card = OgCard({ page, language, decor: decors[page], logo })

      const drawn = await render(card, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        format: OG_IMAGE.format,
        quality: OG_IMAGE.quality,
        fonts
      })

      const file = path.join(PUBLIC_DIR, ogPathOf({ page, language }))

      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, drawn)
    })
  })

  await Promise.all(drawings)

  return drawings.length
}
