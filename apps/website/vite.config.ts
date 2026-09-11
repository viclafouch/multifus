import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { HOST } from './src/constants/site.ts'
import { everyPath } from './src/helpers/page.ts'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        failOnError: true
      },
      pages: everyPath().map((route) => {
        return { path: route, prerender: { enabled: true } }
      }),
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
