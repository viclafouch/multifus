import { defineConfig } from 'oxlint'
import {
  hooks,
  imports,
  jsxA11y,
  react,
  typescript,
  vitest
} from '@viclafouch/oxc-config'

const TEST_PLUGINS = [
  ...typescript.plugins,
  ...react.plugins,
  ...hooks.plugins,
  ...jsxA11y.plugins,
  ...imports.plugins,
  ...vitest.plugins
]

export default defineConfig({
  extends: [typescript, react, hooks, jsxA11y, imports],
  ignorePatterns: [
    '**/node_modules/**',
    'dist/**',
    'src-tauri/**',
    'scripts/*.cjs'
  ],
  options: {
    typeAware: true,
    typeCheck: true
  },
  overrides: [
    {
      files: ['src/**/*.test.ts'],
      plugins: TEST_PLUGINS,
      rules: {
        ...vitest.rules,
        'vitest/consistent-test-filename': [
          'error',
          { pattern: String.raw`.*\.test\.ts$` }
        ]
      }
    },
    {
      files: ['src/components/ui/**', 'src/lib/utils.ts'],
      rules: {
        'typescript/prefer-readonly-parameter-types': 'off',
        'react/function-component-definition': 'off',
        'eslint/no-restricted-imports': 'off'
      }
    },
    {
      files: [
        'src/app.tsx',
        'src/components/**',
        'src/hooks/**',
        'src/screens/**',
        'src/lib/drag.ts'
      ],
      rules: {
        'typescript/prefer-readonly-parameter-types': 'off'
      }
    }
  ]
})
