/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @type {import('eslint').Linter.Config}
 */
const config = {
  root: true,
  plugins: ['@typescript-eslint', 'import', 'react-hooks', 'sonarjs', 'unicorn'],
  globals: {
    globalThis: 'readonly',
    __IS_SERVER__: 'readonly',
    SERVER: 'readonly',
    APP_VERSION: 'readonly',
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:sonarjs/recommended',
    'plugin:prettier/recommended',
    'plugin:import/typescript',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    project: ['tsconfig.json', 'tools/tsconfig.json', 'tsconfigs/tsconfig.eslint.json', 'docs/tsconfig.json'],
  },
  settings: {
    react: {
      pragma: 'React',
      version: 'detect',
    },
    'import/internal-regex': '^@perfsee/',
  },
  rules: {
    // 0 = off, 1 = warn, 2 = error
    'no-console': [2, { allow: ['error', 'warn', 'info', 'assert'] }],
    'comma-dangle': ['error', 'only-multiline'],
    'no-var': 2,
    'one-var-declaration-per-line': 2,
    'prefer-const': 2,
    'no-const-assign': 2,
    'no-unused-vars': [2, { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    eqeqeq: [2, 'always', { null: 'ignore' }],

    'import/first': 2,
    'import/newline-after-import': 2,
    'import/order': [
      2,
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      },
    ],
    'import/no-extraneous-dependencies': 2,
    'import/no-relative-packages': 2,

    'react/prop-types': 0,
    'react/jsx-no-multiline-js': 0,
    'react/jsx-equals-spacing': 0,
    'react/no-find-dom-node': 0,
    'react/react-in-jsx-scope': 0,
    'react/jsx-key': 2,
    'react/no-string-refs': 2,
    'react/self-closing-comp': 2,
    'react/no-deprecated': 2,
    'react/jsx-no-bind': 2,
    'react/display-name': 0,
    'react/jsx-no-target-blank': 0,
    'react/no-unescaped-entities': 0,

    'sonarjs/cognitive-complexity': 0,
    'sonarjs/no-duplicate-string': 0,
    'sonarjs/no-identical-functions': 0,
    'sonarjs/no-nested-template-literals': 0,
    'sonarjs/no-small-switch': 2,

    'unicorn/filename-case': ['error', { case: 'kebabCase' }],
  },
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        'react-hooks/rules-of-hooks': 2,
        'react-hooks/exhaustive-deps': 2,
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        // TypeScript will handle it
        'no-undef': 0,
        // TypeScript declare merge
        'no-redeclare': 0,
        'no-useless-constructor': 0,
        'no-unused-vars': 0,
        'no-dupe-class-members': 0,
        'no-case-declarations': 0,
        'no-duplicate-imports': 0,
        // TypeScript Interface and Type
        'no-use-before-define': 0,
        'require-await': 0,
        '@typescript-eslint/require-array-sort-compare': [2, { ignoreStringArrays: true }],
        '@typescript-eslint/no-duplicate-imports': 2,
        '@typescript-eslint/adjacent-overload-signatures': 2,
        '@typescript-eslint/await-thenable': 2,
        '@typescript-eslint/consistent-type-assertions': 2,
        '@typescript-eslint/ban-types': [
          'error',
          {
            types: {
              String: { message: 'Use string instead', fixWith: 'string' },
              Number: { message: 'Use number instead', fixWith: 'number' },
              Boolean: { message: 'Use boolean instead', fixWith: 'boolean' },
              Function: { message: 'Use explicit type instead' },
            },
          },
        ],
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          {
            accessibility: 'explicit',
            overrides: {
              accessors: 'no-public',
              constructors: 'no-public',
              methods: 'no-public',
              properties: 'no-public',
              parameterProperties: 'explicit',
            },
          },
        ],
        '@typescript-eslint/method-signature-style': 2,
        '@typescript-eslint/no-floating-promises': 2,
        '@typescript-eslint/no-implied-eval': 2,
        '@typescript-eslint/no-for-in-array': 2,
        '@typescript-eslint/no-inferrable-types': 2,
        '@typescript-eslint/no-invalid-void-type': 2,
        '@typescript-eslint/no-misused-new': 2,
        '@typescript-eslint/no-misused-promises': 2,
        '@typescript-eslint/no-namespace': 2,
        '@typescript-eslint/no-non-null-asserted-optional-chain': 2,
        '@typescript-eslint/no-throw-literal': 2,
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 2,
        '@typescript-eslint/prefer-for-of': 2,
        '@typescript-eslint/switch-exhaustiveness-check': 2,
        '@typescript-eslint/prefer-optional-chain': 2,
        '@typescript-eslint/prefer-readonly': 2,
        '@typescript-eslint/prefer-string-starts-ends-with': 0,
        '@typescript-eslint/no-array-constructor': 2,
        '@typescript-eslint/require-await': 2,
        '@typescript-eslint/return-await': [2, 'in-try-catch'],
        '@typescript-eslint/ban-ts-comment': [
          2,
          { 'ts-expect-error': false, 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false },
        ],
        '@typescript-eslint/naming-convention': [
          2,
          {
            selector: 'memberLike',
            format: ['camelCase', 'PascalCase'],
            modifiers: ['private'],
            leadingUnderscore: 'forbid',
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          2,
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true },
        ],
        '@typescript-eslint/member-ordering': [
          2,
          {
            default: [
              'public-static-field',
              'protected-static-field',
              'private-static-field',
              'public-static-method',
              'protected-static-method',
              'private-static-method',
              'public-instance-field',
              'protected-instance-field',
              'private-instance-field',
              'public-constructor',
              'protected-constructor',
              'private-constructor',
              'public-instance-method',
              'protected-instance-method',
              'private-instance-method',
            ],
          },
        ],
      },
    },
    {
      files: ['examples/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      globals: {
        Cypress: 'readonly',
        cy: 'readonly',
      },
      rules: {
        'sonarjs/no-small-switch': 0,
        'sonarjs/no-ignored-return': 0,
        '@typescript-eslint/no-floating-promises': 0,
        '@typescript-eslint/no-namespace': 0,
        '@typescript-eslint/prefer-nullish-coalescing': 0,
        '@typescript-eslint/prefer-optional-chain': 0,

        'import/no-extraneous-dependencies': 0,
        'import/no-relative-packages': 0,
      },
    },
    {
      files: ['packages/**/__{tests,test}__/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      rules: {
        'no-prototype-builtins': 0,
        '@typescript-eslint/prefer-nullish-coalescing': 0,
        '@typescript-eslint/prefer-optional-chain': 0,
        '@typescript-eslint/no-floating-promises': 0,
        '@typescript-eslint/no-namespace': 0,

        'import/no-extraneous-dependencies': 0,
        'import/no-relative-packages': 0,
      },
    },
    {
      files: ['tools/**/*.{ts,tsx,js}', './*.js'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/require-await': 0,

        'import/no-extraneous-dependencies': 0,
        'import/no-relative-packages': 0,
      },
    },
  ],
}

module.exports = config
