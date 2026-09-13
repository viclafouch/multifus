type OgFont = Readonly<{
  name: string
  file: string
}>

export const OG_FONTS = {
  carve: {
    name: 'Bebas Neue',
    file: '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2'
  },
  plain: {
    name: 'Roboto',
    file: '@fontsource/roboto/files/roboto-latin-400-normal.woff2'
  }
} as const satisfies Record<string, OgFont>
