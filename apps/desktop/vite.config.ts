import path from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vitest/config'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const host = process.env.TAURI_DEV_HOST ?? ''
const isRemoteHost = host !== ''

export default defineConfig({
  plugins: [
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

  build: {
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, './index.html'),
        banner: path.resolve(import.meta.dirname, './banner.html'),
        wheel: path.resolve(import.meta.dirname, './wheel.html'),
        runeTable: path.resolve(import.meta.dirname, './rune-table.html')
      }
    }
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: isRemoteHost ? host : false,
    hmr: isRemoteHost
      ? {
          protocol: 'ws',
          host,
          port: 1421
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },

  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    mockReset: true,
    env: {
      TZ: 'UTC'
    }
  }
})
