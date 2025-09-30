import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage', '.bmad-core', 'scripts'],
  },
  ...compat.extends(
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ),
  ...compat.config({
    env: {
      es2022: true,
      node: true,
    },
    parserOptions: {
      project: ['./tsconfig.json'],
      tsconfigRootDir: __dirname,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
          moduleDirectory: ['node_modules', 'src', 'tests'],
        },
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@/'],
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['tests/**/*', 'vitest.config.ts'],
        },
      ],
      'import/order': 'off',
      'import/no-cycle': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'off',
    },
  }),
];
