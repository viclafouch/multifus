/// <reference types="node" />
import { readFile } from 'node:fs/promises'

export const WORDMARK = 'MULTIFUS'

export const TAGLINE = 'Gestionnaire de fenêtres pour Dofus Retro'

type RetroFont = Readonly<{
  name: string
  file: string
}>

export const RETRO_FONTS = {
  carve: {
    name: 'Bebas Neue',
    file: '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2'
  },
  plain: {
    name: 'Roboto',
    file: '@fontsource/roboto/files/roboto-latin-400-normal.woff2'
  }
} as const satisfies Record<string, RetroFont>

export const inkedWith = (color: string, alpha: number) => {
  const channels = [1, 3, 5].map((at) => {
    return Number.parseInt(color.slice(at, at + 2), 16)
  })

  return `rgb(${channels.join(' ')} / ${alpha})`
}

const HEX_DECLARATION = /--([a-z-]+):\s*(#[\da-f]{6})\b/gu

export const paletteOf = (sheet: string) => {
  const declared = new Map<string, string>()

  for (const found of sheet.matchAll(HEX_DECLARATION)) {
    declared.set(found[1], found[2])
  }

  const hexOf = (name: string) => {
    const hex = declared.get(name)

    if (hex === undefined) {
      throw new Error(`no retro sheet declares --${name} as a hex color`)
    }

    return hex
  }

  return {
    iron: hexOf('iron'),
    slate: hexOf('slate'),
    band: hexOf('band'),
    khaki: hexOf('khaki'),
    cream: hexOf('cream'),
    leaf: hexOf('leaf'),
    leafLit: hexOf('leaf-lit')
  }
}

export const dataUrlOf = (markup: string) => {
  return `data:image/svg+xml,${encodeURIComponent(markup)}`
}

export const loadFonts = (resolve: (specifier: string) => string) => {
  return Promise.all(
    Object.values(RETRO_FONTS).map(async ({ name, file }) => {
      return { name, data: await readFile(resolve(file)) }
    })
  )
}
