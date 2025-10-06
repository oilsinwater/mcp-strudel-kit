import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import pluginImport from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'temp/**',
      'config/**',
      'eslint.config.mjs',
      'package-lock.json',
    ],
  },
  js.configs.recommended,
  ...compat.extends('airbnb-base', 'airbnb-typescript/base', 'prettier'),
  {
    files: ['src/**/*.ts', 'vitest.config.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },
    plugins: {
      import: pluginImport,
    },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            'tests/**/*.{ts,tsx}',
            'vitest.config.ts',
            '**/*.config.{ts,cts,mts}',
          ],
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'import/extensions': 'off',
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'vars-on-top': 'off',
      'no-promise-executor-return': 'off',
      'no-plusplus': 'off',
      'prefer-template': 'off',
      'import/prefer-default-export': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
