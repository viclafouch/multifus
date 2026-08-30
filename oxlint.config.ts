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
    '**/dist/**',
    'apps/desktop/src-tauri/**',
    'apps/desktop/scripts/*.cjs'
  ],
  options: {
    typeAware: true,
    typeCheck: true
  },
  overrides: [
    {
      files: [
        'apps/desktop/src/**/*.test.ts',
        'apps/desktop/src/**/*.test.tsx'
      ],
      plugins: TEST_PLUGINS,
      rules: {
        ...vitest.rules,
        'vitest/consistent-test-filename': [
          'error',
          { pattern: String.raw`.*\.test\.tsx?$` }
        ]
      }
    },
    {
      files: [
        'apps/desktop/src/lib/multifus.test.ts',
        'apps/desktop/src/test-doubles.ts'
      ],
      rules: {
        'typescript/prefer-readonly-parameter-types': 'off'
      }
    },
    {
      files: [
        'apps/desktop/src/components/ui/**',
        'apps/desktop/src/lib/utils.ts'
      ],
      rules: {
        'typescript/prefer-readonly-parameter-types': 'off',
        'react/function-component-definition': 'off'
      }
    },
    {
      files: [
        'apps/desktop/src/app.tsx',
        'apps/desktop/src/components/**',
        'apps/desktop/src/hooks/**',
        'apps/desktop/src/screens/**',
        'apps/desktop/src/lib/drag.ts'
      ],
      rules: {
        'typescript/prefer-readonly-parameter-types': 'off'
      }
    }
  ]
})
