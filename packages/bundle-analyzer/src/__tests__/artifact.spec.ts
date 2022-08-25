import test from 'ava'

import { getPackageMeta, resolveNodeModulePath, trimModuleName } from '../module'

test('should trim webpack module name correctly', (t) => {
  t.deepEqual(
    [
      'loader1!/loader2!./path/to/module',
      './path/to/module (ignored)',
      'multi ./path/to/module1 ./path/to/module2',
      './path/to/module sync (...)',
      './path/to/module +3 modules',
      './next-client-pages-loader.js?page=./entry.js',
      './path/to/module?sync=true',
      'multi loader1!./module/with/ext.js?sync=true',
      './node_modules/@namespace/name sync *',
      './node_modules/name sync *',
      './node_modules/babel-loader/lib!./node_modules/vue-loader/lib??vue-loader-options!./src/components/common/perf-filter-panel.vue?vue&type=script&lang=js&',
    ].map(trimModuleName),
    [
      './path/to/module',
      './path/to/module',
      './path/to/module2',
      './path/to/module',
      './path/to/module',
      './entry.js',
      './path/to/module',
      './module/with/ext.js',
      './node_modules/@namespace/name',
      './node_modules/name',
      './src/components/common/perf-filter-panel.vue',
    ],
  )
})

test('should resolve modules path correctly', (t) => {
  t.deepEqual(
    resolveNodeModulePath('/workspace/foo/node_modules/@foo/bar/node_modules/abc/example.js', '/workspace/foo'),
    {
      path: '/workspace/foo/node_modules/@foo/bar/node_modules/abc',
      moduleName: 'abc',
      dependentPath: 'node_modules/@foo/bar/node_modules/abc',
    },
  )
})

test('should get nodule modules path and name correctly', (t) => {
  t.deepEqual(
    [
      './node_modules/name/esm/index.js',
      './node_modules/@namespace/name/esm/index.js',
      './node_modules/name/node_modules/name2/esm/index.js',
      './node_modules/@namespace/name/node_modules/name2/esm/index.js',
      './node_modules/@namespace/name/node_modules/@namespace/name2/esm/index.js',
      './node_modules/@namespace/name sync *',
      './node_modules/anymodule sync *',
      './node_modules/anymodule (ignored)',
      'fs (ignored)',
    ].map((path) => getPackageMeta(path, '/workspace', '/workspace')),
    [
      { name: 'name', path: 'node_modules/name' },
      { name: '@namespace/name', path: 'node_modules/@namespace/name' },
      { name: 'name2', path: 'node_modules/name/node_modules/name2' },
      { name: 'name2', path: 'node_modules/@namespace/name/node_modules/name2' },
      { name: '@namespace/name2', path: 'node_modules/@namespace/name/node_modules/@namespace/name2' },
      { name: '@namespace/name', path: 'node_modules/@namespace/name' },
      { name: 'anymodule', path: 'node_modules/anymodule' },
      null,
      null,
    ],
  )
})
