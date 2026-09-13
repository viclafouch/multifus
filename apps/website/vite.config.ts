import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import {
  HOST,
  LOST_FILE,
  LOST_PATH,
  ROBOTS_PATH
} from './src/constants/site.ts'
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

export default defineConfig({
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
        host: HOST
      }
    }),
    react({ compiler: true }),
    tailwindcss(),
    lingui({ failOnMissing: true, failOnCompileError: true }),
    babel({ presets: [linguiTransformerBabelPreset()] })
  ],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },

  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'jsdom',
    pool: 'vmThreads',
    mockReset: true
  }
})
