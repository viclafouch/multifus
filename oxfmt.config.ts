import { defineConfig } from 'oxfmt'
import { oxfmtConfig } from '@viclafouch/oxc-config/formatting'

export default defineConfig({
  ...oxfmtConfig,
  ignorePatterns: [
    '**/node_modules/**',
    'dist/**',
    'src-tauri/**',
    'package-lock.json',
    'CHANGELOG.md'
  ]
})
