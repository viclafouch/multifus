import { defineConfig } from 'oxfmt'
import { oxfmtConfig } from '@viclafouch/oxc-config/formatting'

export default defineConfig({
  ...oxfmtConfig,
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.turbo/**',
    'apps/website/.output/**',
    'apps/website/src/routeTree.gen.ts',
    'apps/desktop/src-tauri/**',
    'pnpm-lock.yaml',
    '**/CHANGELOG.md'
  ]
})
