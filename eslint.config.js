import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Generated shadcn/ui kit exception: these files export variant helpers
    // (e.g. cva maps, hooks) alongside components by design; fast-refresh
    // purity is not actionable for generated code.
    files: ['src/components/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // src/providers/trpc.tsx is frozen infrastructure (exports the TRPCProvider
    // component plus a client factory); the file itself may not be edited, so
    // the fast-refresh purity rule is disabled for it here.
    files: ['src/providers/trpc.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
