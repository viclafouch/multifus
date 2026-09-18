/// <reference types="node" />
import { readFile } from 'node:fs/promises'

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
