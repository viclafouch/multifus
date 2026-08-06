import path from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Set by `tauri dev` when serving to a physical device on the local network
const host = process.env.TAURI_DEV_HOST ?? ''
const isRemoteHost = host !== ''

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
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
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**']
    }
  },

  test: {
    include: ['src/**/*.test.ts'],
    // Node and not a simulated browser: `navigator.userAgent` is `Node.js/24`
    // there, so `IS_APPLE` is false on this machine as on the runner.
    environment: 'node',
    // Pinned, without which the journal reads one hour here and another on the
    // runner, which is in UTC.
    env: {
      TZ: 'UTC'
    }
  }
})
