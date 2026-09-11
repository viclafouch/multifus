import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-po'

export default defineConfig({
  sourceLocale: 'fr',
  locales: ['fr', 'en', 'es'],
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['<rootDir>/src'],
      exclude: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx']
    }
  ],
  format: formatter({ lineNumbers: false })
})
