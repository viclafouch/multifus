import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { LOST_FILE, LOST_PATH, ROBOTS_PATH } from './src/constants/site.ts'
import { everyPath } from './src/helpers/page.ts'

type StartPage = NonNullable<
  NonNullable<Parameters<typeof tanstackStart>[0]>['pages']
>[number]

const ASIDE_PAGES = [
  {
    path: LOST_PATH,
    sitemap: { exclude: true },
    prerender: { enabled: true, outputPath: LOST_FILE }
  },
  {
    path: ROBOTS_PATH,
    sitemap: { exclude: true },
    prerender: { enabled: true, outputPath: ROBOTS_PATH }
  }
] as const satisfies readonly StartPage[]

export const SOURCE_ALIAS = {
  '@': path.resolve(import.meta.dirname, './src')
}

export const SOURCE_PLUGINS = [
  babel({ presets: [linguiTransformerBabelPreset()] }),
  react({ compiler: true }),
  lingui({ failOnMissing: true, failOnCompileError: true })
]

const originOf = (mode: string) => {
  const { VITE_SITE_URL } = loadEnv(mode, import.meta.dirname, 'VITE_')

  try {
    return new URL(VITE_SITE_URL).origin
  } catch {
    throw new Error(
      `VITE_SITE_URL absente ou invalide pour le mode ${mode} : ajoutez-la au .env du site`
    )
  }
}

// oxlint-disable-next-line prefer-readonly-parameter-types -- la signature du rappel appartient à ConfigEnv de Vite
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      tanstackStart({
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: false,
          crawlLinks: false,
          failOnError: true
        },
        pages: [
          ...everyPath().map((route) => {
            return { path: route, prerender: { enabled: true } }
          }),
          ...ASIDE_PAGES
        ],
        sitemap: {
          enabled: true,
          host: originOf(mode)
        }
      }),
      tailwindcss(),
      ...SOURCE_PLUGINS
    ],
    resolve: {
      alias: SOURCE_ALIAS
    },
    server: {
      port: Number(new URL(originOf('development')).port),
      strictPort: true
    },
    test: {
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'jsdom',
      pool: 'vmThreads',
      mockReset: true
    }
  }
})
