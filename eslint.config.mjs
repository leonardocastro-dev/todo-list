// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'

export default withNuxt([
  {
    files: ['**/*.{ts,tsx,vue}'],
    plugins: {
      prettier
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off'
    },
    ...tseslint.configs.recommended
  }
])
